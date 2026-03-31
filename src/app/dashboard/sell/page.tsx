'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronLeft, X, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { countryCodes } from '@/lib/country-codes';
import { useFirestore, useAuth } from '@/firebase';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories } from '@/lib/categories';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from '@/lib/audit';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

const CLOUDINARY_CLOUD_NAME = "dfunyyw6g";
const CLOUDINARY_UPLOAD_PRESET = "video_upload_preset";
const MAX_IMAGE_RES = 3840;
const MAX_VIDEO_DURATION = 60; // secondes

// ✅ Tronque la vidéo à 60s côté navigateur (sans dépendance externe)
const trimVideoTo60s = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;

    video.onloadedmetadata = () => {
      // Si la vidéo fait moins de 60s, on la retourne telle quelle
      if (video.duration <= MAX_VIDEO_DURATION) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      // Sinon, on enregistre les 60 premières secondes via MediaRecorder
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

      // Arrête l'enregistrement après 60 secondes
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

// Upload vers Cloudinary (simple, sans eager)
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
    console.error("Cloudinary error:", errorData);
    throw new Error(errorData.error?.message || "Upload échoué.");
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
      resolve(canvas.toDataURL('image/jpeg', 0.7));
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

  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video'; uploading?: boolean; uploadLabel?: string }[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [countryCode, setCountryCode] = useState('+223');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<'Neuf' | 'Comme neuf' | 'Occasion'>('Neuf');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moderationMessage, setModerationMessage] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`);
          const data = await response.json();
          if (data.locality || data.city) setLocation(data.locality || data.city);
        } catch (error) {
          console.error('Error fetching address:', error);
        } finally {
          setIsFetchingLocation(false);
        }
      }, () => setIsFetchingLocation(false));
    }
  }, []);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let firstImageProcessed = false;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        setMediaPreviews(prev => [...prev, { url: '', type: 'video', uploading: true, uploadLabel: 'Préparation...' }]);

        try {
          // Étape 1 : tronquer à 60s si nécessaire
          setMediaPreviews(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(p => p.uploading && p.url === '');
            if (idx !== -1) updated[idx] = { ...updated[idx], uploadLabel: 'Découpage à 1 min...' };
            return updated;
          });

          const trimmedFile = await trimVideoTo60s(file);

          // Étape 2 : upload vers Cloudinary
          setMediaPreviews(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(p => p.uploading && p.url === '');
            if (idx !== -1) updated[idx] = { ...updated[idx], uploadLabel: 'Upload en cours...' };
            return updated;
          });

          const videoUrl = await uploadVideoToCloudinary(trimmedFile);

          setMediaPreviews(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(p => p.uploading && p.url === '');
            if (idx !== -1) updated[idx] = { url: videoUrl, type: 'video', uploading: false };
            return updated;
          });

          toast({ title: "Vidéo ajoutée ✅", description: "Limitée à la première minute." });

        } catch (e: any) {
          console.error("Erreur upload video:", e.message);
          setMediaPreviews(prev => prev.filter(p => !(p.uploading && p.url === '')));
          toast({
            variant: "destructive",
            title: "Erreur vidéo",
            description: e.message || "Impossible d'uploader la vidéo.",
          });
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let resultUrl = await resizeImage(e.target?.result as string);
          setMediaPreviews(prev => {
            if (prev.length === 0 && !firstImageProcessed) {
              firstImageProcessed = true;
              analyzeWithMami(resultUrl);
            }
            return [...prev, { url: resultUrl, type: 'image' }];
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
    setModerationMessage("Mami vérifie l'annonce...");

    try {
      const moderateImageFn = httpsCallable(getFunctions(getApp(), 'europe-west1'), 'moderateAnnonce');
      const modResult: any = await moderateImageFn({ titre: title, description, prix: `${price} FCFA` });

      const isApproved = modResult.data.approved;
      const cleanWhatsapp = `${countryCode}${whatsappNumber.replace(/\D/g, '')}`;

      await addDoc(collection(db, "annonces"), {
        titre: title,
        prix: `${price} FCFA`,
        media: mediaPreviews.map(m => ({ url: m.url, type: m.type })),
        vendeurId: auth.currentUser.uid,
        status: isApproved ? 'approved' : 'rejected',
        description,
        localisation: location,
        whatsapp: cleanWhatsapp,
        categorie: category || "Autre",
        etat: condition,
        createdAt: serverTimestamp(),
        views: 0
      });

      toast({ title: "Succès !", description: "Votre annonce est enregistrée." });
      router.push('/dashboard');
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la publication." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b p-4 sticky top-0 z-30 flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2"><ChevronLeft /></button>
        <h1 className="text-xl font-bold">Vendre sur SuguMali</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
        <section className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Photos & Vidéos (Max 1 min)
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {mediaPreviews.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                {m.uploading ? (
                  <div className="flex h-full items-center justify-center flex-col gap-2 p-2 text-center">
                    <Loader2 className="animate-spin text-orange-500" />
                    <span className="text-xs text-muted-foreground">{m.uploadLabel || 'Chargement...'}</span>
                  </div>
                ) : m.type === 'image' ? (
                  <img src={m.url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <video src={m.url} className="h-full w-full object-cover" muted autoPlay loop />
                )}
                {!m.uploading && (
                  <button
                    type="button"
                    onClick={() => setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center hover:border-orange-400 transition-colors"
            >
              <Camera className="text-muted-foreground" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
        </section>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="space-y-2">
            <Label>
              Titre{' '}
              {isAnalyzing && <span className="text-orange-500 text-xs">Mami analyse...</span>}
            </Label>
            <input
              type="text"
              className="w-full bg-muted/40 p-4 rounded-xl outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix (FCFA)</Label>
              <input
                type="number"
                className="w-full bg-muted/40 p-4 rounded-xl outline-none"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <input
                type="tel"
                className="w-full bg-muted/40 p-4 rounded-xl outline-none"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              rows={4}
              className="w-full bg-muted/40 p-4 rounded-xl outline-none resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || mediaPreviews.some(m => m.uploading)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl flex flex-col items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isLoading
            ? <><Loader2 className="animate-spin" /><span>{moderationMessage}</span></>
            : <><Sparkles size={20} /><span>Publier l'annonce</span></>
          }
        </button>
      </form>
    </div>
  );
}
