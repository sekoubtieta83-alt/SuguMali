'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, ChevronLeft, X, Loader2, MapPin, Sparkles, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { countryCodes } from '@/lib/country-codes';
import { useFirestore, useAuth } from '@/firebase';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories } from '@/lib/categories';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { logActivity } from '@/lib/audit';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const MAX_VIDEO_DURATION = 30; // 30 seconds

const resizeImage = (base64Str: string, maxWidth = 1080, maxHeight = 1080): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
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

  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [countryCode, setCountryCode] = useState('+223');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<'Neuf' | 'Comme neuf' | 'Occasion'>('Neuf');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > MAX_VIDEO_DURATION) {
            toast({
              variant: "destructive",
              title: "Vidéo trop longue",
              description: `La durée maximale autorisée est de ${MAX_VIDEO_DURATION} secondes.`
            });
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const resultUrl = e.target?.result as string;
            setMediaPreviews(prev => [...prev, { url: resultUrl, type: 'video' }]);
          };
          reader.readAsDataURL(file);
        };
        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let resultUrl = e.target?.result as string;
          resultUrl = await resizeImage(resultUrl);
          setMediaPreviews(prev => [...prev, { url: resultUrl, type: 'image' }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db) return;
    
    const user = auth?.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "Non connecté", description: "Vous devez être connecté pour publier." });
      return;
    }

    if (mediaPreviews.length === 0) {
      toast({ variant: "destructive", title: "Media requis", description: "Veuillez ajouter au moins une photo ou vidéo." });
      return;
    }

    setIsLoading(true);

    try {
      const cleanWhatsapp = `${countryCode}${whatsappNumber.replace(/\D/g, '')}`;

      const annonceData = {
        titre: title || "Sans titre",
        prix: price ? `${price} FCFA` : "0 FCFA",
        // Stocker tous les medias
        media: mediaPreviews,
        image: mediaPreviews[0]?.url || "", // Garder pour compatibilité
        vendeurId: user.uid,
        status: 'approved',
        description: description,
        localisation: location,
        whatsapp: cleanWhatsapp,
        categorie: category || "Autre",
        etat: condition,
        createdAt: serverTimestamp(),
        views: 0
      };

      const annoncesCollection = collection(db, "annonces");
      
      await addDoc(annoncesCollection, annonceData)
        .catch(async (serverError: any) => {
          if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: annoncesCollection.path,
              operation: 'create',
              requestResourceData: annonceData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
          }
        });
      
      logActivity(db, {
        action: 'AUTO_MODERATION',
        userId: user.uid,
        userName: user.displayName || 'Utilisateur',
        targetName: title,
        details: 'Annonce publiée'
      });

      toast({ 
        title: "Annonce envoyée !", 
        description: "Votre annonce est désormais visible."
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue lors de la publication." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b p-3 sm:p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-4 sm:gap-6">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Vendre un article</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-10">
        <section className="space-y-3 sm:space-y-4">
          <Label className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            PHOTOS & VIDÉOS <span className="normal-case font-normal">(Vidéos: max 30s)</span>
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {mediaPreviews.map((m, i) => (
              <div key={i} className="relative aspect-square rounded-2xl sm:rounded-[2rem] overflow-hidden border border-border group shadow-sm bg-muted">
                {m.type === 'image' ? (
                  <img src={m.url} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={m.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    <div className="absolute top-1 left-1 bg-black/50 p-1 rounded-full">
                        <Video size={10} className="text-white" />
                    </div>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => setMediaPreviews(prev => prev.filter((_, idx) => idx !== i))} 
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/50 text-white rounded-full p-1 sm:p-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="aspect-square border-2 border-dashed border-muted-foreground/20 rounded-2xl sm:rounded-[2rem] flex flex-col items-center justify-center gap-1 sm:gap-2 hover:bg-muted/50 hover:border-accent/40 transition-all group"
            >
              <div className="bg-muted p-2 sm:p-3 rounded-full group-hover:bg-accent/10 transition-colors">
                <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-accent transition-colors" /> 
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase group-hover:text-accent text-center px-1">Ajouter</span>
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,video/*" className="hidden" />
        </section>

        <div className="bg-card p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-border/50 shadow-sm space-y-6 sm:space-y-8">
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm font-bold ml-1 sm:ml-2">Titre de l'annonce</Label>
            <input 
              type="text" 
              placeholder="ex: iPhone 13 Pro Max" 
              className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 outline-none focus:ring-2 focus:ring-accent/50 transition-all text-foreground text-base sm:text-lg" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm font-bold ml-1 sm:ml-2">État</Label>
            <RadioGroup value={condition} onValueChange={(v: any) => setCondition(v)} className="flex flex-wrap gap-3 sm:gap-4 ml-1 sm:ml-2">
              {['Neuf', 'Comme neuf', 'Occasion'].map(c => (
                <div key={c} className="flex items-center space-x-2">
                  <RadioGroupItem value={c} id={c} className="border-muted-foreground/30 text-accent h-4 w-4" />
                  <Label htmlFor={c} className="text-xs sm:text-sm font-medium cursor-pointer">{c}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold ml-1 sm:ml-2">Localisation</Label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Bamako" 
                  className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 pl-10 sm:pl-12 outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm sm:text-base" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  required 
                />
                <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                {isFetchingLocation && <Loader2 className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 animate-spin text-accent" />}
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold ml-1 sm:ml-2">WhatsApp</Label>
              <div className="flex gap-2">
                <select 
                  value={countryCode} 
                  onChange={e => setCountryCode(e.target.value)} 
                  className="bg-muted/30 border-none rounded-xl sm:rounded-2xl px-2 sm:px-4 py-4 sm:py-5 outline-none focus:ring-2 focus:ring-accent/50 text-xs sm:text-sm"
                >
                  {countryCodes.map(c => <option key={c.code} value={c.dial_code}>{c.flag} {c.dial_code}</option>)}
                </select>
                <input 
                  type="tel" 
                  placeholder="76 00 00 00" 
                  className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm sm:text-base" 
                  value={whatsappNumber} 
                  onChange={e => setWhatsappNumber(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold ml-1 sm:ml-2">Catégorie</Label>
              <select 
                className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 outline-none focus:ring-2 focus:ring-accent/50 text-sm sm:text-base" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                required
              >
                <option value="">Choisir...</option>
                {categories.map(c => (
                  <optgroup label={c.name} key={c.name}>
                    {c.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-bold ml-1 sm:ml-2">Prix (FCFA)</Label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 outline-none focus:ring-2 focus:ring-accent/50 text-sm sm:text-base" 
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm font-bold ml-1 sm:ml-2">Description</Label>
            <textarea 
              rows={4} 
              placeholder="Décrivez votre article..." 
              className="w-full bg-muted/30 border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 outline-none resize-none focus:ring-2 focus:ring-accent/50 text-sm sm:text-base" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full bg-accent hover:bg-accent/90 text-white font-black py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-xl shadow-accent/20 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 transition-all active:scale-[0.98] text-base sm:text-lg"
        >
          {isLoading ? (
            <><Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6" /> Envoi...</>
          ) : (
            <><Sparkles className="h-5 w-5 sm:h-6 sm:w-6" /> Publier l'annonce</>
          )}
        </button>
      </form>
    </div>
  );
}
