'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronLeft, X, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth } from '@/firebase';
import { Label } from '@/components/ui/label';
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

const CLOUDINARY_CLOUD_NAME = "dfunyyw6g";
const CLOUDINARY_UPLOAD_PRESET = "video_upload_preset";
const MAX_IMAGE_RES = 1920;
const MAX_VIDEO_DURATION = 60; // secondes

// ✅ Tronque la vidéo à 60s côté navigateur
const trimVideoTo60s = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;

    video.onloadedmetadata = () => {
      if (video.duration <= MAX_VIDEO_DURATION) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const stream = (video as any).captureStream();
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
        const trimmedFile = new File([trimmedBlob], file.name.replace(/\.[^.]+$/, '.webm'), {
          type: 'video/webm',
        });
        resolve(trimmedFile);
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Erreur lors du découpage de la vidéo."));
      };

      video.play();
      recorder.start();

      setTimeout(() => {
        recorder.stop();
        video.pause();
      }, MAX_VIDEO_DURATION * 1000);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire la vidéo."));
    };
  });
};

const uploadVideoToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Upload vidéo échoué.");
  }

  const data = await response.json();
  return data.secure_url;
};

const resizeImage = (base64Str: string, maxWidth = MAX_IMAGE_RES, maxHeight = MAX_IMAGE_RES): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) { height *= maxWidth / width; width = maxWidth; }
        else { width *= maxHeight / height; height = maxHeight; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function SellPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = useAuth();
  const db = useFirestore();

  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video'; uploading?: boolean; file?: File; firebaseInProgress?: boolean }>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');

  const analyzeWithMami = async (imageBase64: string) => {
    try {
      setIsAnalyzing(true);
      const functions = getFunctions(getApp(), 'europe-west1');
      const analyzeImage = httpsCallable(functions, 'analyzeImage');
      const result: any = await analyzeImage({ imageBase64 });
      const data = result.data;
      if (data.titre && !title) setTitle(data.titre);
      if (data.description && !description) setDescription(data.description);
      toast({ title: "Mami a analysé votre photo", description: "Titre et description générés." });
    } catch (err) {
      console.error('Erreur Mami:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadImageToFirebase = async (base64: string): Promise<string> => {
    if (!auth.currentUser) throw new Error("Connectez-vous pour continuer.");
    const storage = getStorage(getApp());
    const storageRef = ref(storage, `annonces/${auth.currentUser.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        setMediaPreviews(prev => [...prev, { url: '', type: 'video', uploading: true }]);
        try {
          const trimmedFile = await trimVideoTo60s(file);
          const videoUrl = await uploadVideoToCloudinary(trimmedFile);
          setMediaPreviews(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(p => p.uploading && p.type === 'video' && p.url === '');
            if (idx !== -1) updated[idx] = { url: videoUrl, type: 'video', uploading: false };
            return updated;
          });
        } catch (e: any) {
          setMediaPreviews(prev => prev.filter(p => !p.uploading));
          toast({ variant: "destructive", title: "Erreur vidéo", description: e.message });
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let base64 = e.target?.result as string;
          let resized = await resizeImage(base64);
          
          setMediaPreviews(prev => {
            if (prev.length === 0) analyzeWithMami(resized);
            return [...prev, { url: resized, type: 'image' }];
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db || !auth.currentUser) return;

    setIsLoading(true);
    setModerationMessage("Téléchargement des images...");

    try {
      // 1. Upload des images vers Firebase Storage (les vidéos sont déjà sur Cloudinary)
      const finalMedia: { url: string; type: 'image' | 'video' }[] = [];
      
      for (const media of mediaPreviews) {
        if (media.type === 'image') {
          // C'est un base64 -> on l'envoie sur Firebase Storage
          const firebaseUrl = await uploadImageToFirebase(media.url);
          finalMedia.push({ url: firebaseUrl, type: 'image' });
        } else {
          // C'est déjà une URL Cloudinary
          finalMedia.push({ url: media.url, type: 'video' });
        }
      }

      setModerationMessage("Mami vérifie l'annonce...");

      // 2. Vérification vendeur
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const isVerified = userSnap.exists() ? Boolean(userSnap.data().isVerified) : false;

      // 3. Modération IA
      const moderateFn = httpsCallable(getFunctions(getApp(), 'europe-west1'), 'moderateAnnonce');
      const modResult: any = await moderateFn({ titre: title, description, prix: `${price} FCFA` });

      const isApproved = modResult.data.approved;

      // 4. Enregistrement Firestore
      await addDoc(collection(db, "annonces"), {
        titre: title,
        prix: `${price} FCFA`,
        media: finalMedia,
        vendeurId: auth.currentUser.uid,
        vendeurVerified: isVerified,
        status: isApproved ? 'approved' : 'rejected',
        moderationReason: modResult.data.reason || '',
        description,
        localisation: location,
        whatsapp: whatsappNumber,
        createdAt: serverTimestamp(),
        views: 0
      });

      toast({ title: isApproved ? "Annonce publiée !" : "Annonce en vérification" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Échec de la publication." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b p-4 sticky top-0 z-30 flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronLeft /></button>
        <h1 className="text-xl font-bold">Vendre un article</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
        <section className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
            Photos et Vidéo
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {mediaPreviews.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border bg-muted shadow-sm group">
                {m.uploading ? (
                  <div className="flex h-full items-center justify-center flex-col gap-2 p-2 text-center">
                    <Loader2 className="animate-spin text-accent" />
                    <span className="text-[10px] font-bold text-muted-foreground">Vidéo...</span>
                  </div>
                ) : m.type === 'image' ? (
                  <img src={m.url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <video src={m.url} className="h-full w-full object-cover" muted autoPlay loop playsInline />
                )}
                <button
                  type="button"
                  onClick={() => setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {mediaPreviews.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-muted hover:border-accent transition-all text-muted-foreground hover:text-accent"
              >
                <Camera size={24} />
                <span className="text-[10px] font-bold">Ajouter</span>
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*" className="hidden" />
        </section>

        <div className="bg-card p-6 rounded-3xl border shadow-sm space-y-5">
          <div className="space-y-2">
            <Label className="font-bold ml-1">Titre de l'annonce {isAnalyzing && <span className="text-accent text-xs italic animate-pulse"> (Mami analyse...)</span>}</Label>
            <input type="text" className="w-full bg-muted/40 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: iPhone 15 Pro Max Neuf" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold ml-1">Prix (FCFA)</Label>
              <input type="number" className="w-full bg-muted/40 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-1">Localisation (Ville / Quartier)</Label>
              <input type="text" className="w-full bg-muted/40 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Ex: Bamako, Hamdallaye ACI" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold ml-1">Description</Label>
            <textarea rows={4} className="w-full bg-muted/40 p-4 rounded-xl outline-none resize-none focus:ring-2 focus:ring-accent/20 transition-all font-medium" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Détaillez l'état de l'article, ses caractéristiques..." />
          </div>

          <div className="space-y-2">
            <Label className="font-bold ml-1">Votre numéro WhatsApp</Label>
            <input type="tel" className="w-full bg-muted/40 p-4 rounded-xl outline-none focus:ring-2 focus:ring-accent/20 transition-all font-bold" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} required placeholder="+22370000000" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || mediaPreviews.some(m => m.uploading)} 
          className="w-full bg-accent hover:bg-accent/90 text-white font-black py-5 rounded-2xl flex flex-col items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-accent/20 active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-6 w-6" />
              <span className="text-sm">{moderationMessage}</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span className="text-lg">Publier sur SuguMali</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
