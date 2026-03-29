'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Smartphone, Upload, CheckCircle2, Loader2, Info, Camera, Send, Rocket } from 'lucide-react';
import { useFirestore, useUser, useFirebaseApp } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface PromotionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  annonceId: string;
  annonceTitle: string;
}

export function PromotionModal({ isOpen, onOpenChange, annonceId, annonceTitle }: PromotionModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setScreenshot(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !firestore || !screenshot || !app) return;
    setIsSubmitting(true);

    try {
      const storage = getStorage(app);
      const fileName = `promotions/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadString(storageRef, screenshot, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      const requestsRef = collection(firestore, 'promotion_requests');
      await addDoc(requestsRef, {
        userId: user.uid,
        userName: user.displayName || 'Utilisateur',
        annonceId,
        annonceTitle,
        screenshotUrl: downloadURL,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Demande envoyée !",
        description: "Votre preuve de paiement a été transmise pour vérification.",
      });
      onOpenChange(false);
      setScreenshot(null);
    } catch (error) {
      console.error("Promotion Error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer votre demande. Réessayez plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <div className="bg-accent p-5 text-white text-center relative overflow-hidden">
          <Rocket className="absolute -right-4 -bottom-4 h-16 w-20 text-white/10 rotate-12" />
          <DialogHeader>
            <DialogTitle className="text-xl font-black mb-0.5">Booster l'annonce</DialogTitle>
            <DialogDescription className="text-white/90 font-medium text-[10px] leading-tight">
              Vendez jusqu'à 5x plus vite sur SuguMali !
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-5 bg-background">
          <div className="space-y-2">
            <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Info className="h-2.5 w-2.5" /> Instructions de paiement
            </h3>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/50 group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 bg-[#FF8C00] rounded-full flex items-center justify-center text-white font-black text-[9px]">OM</div>
                  <div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Orange Money</p>
                    <p className="text-xs font-black">79 05 28 86</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-accent font-black text-[9px]">À partir de 5 000 FCFA</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/50 group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 bg-[#1cbcfc] rounded-full flex items-center justify-center text-white font-black text-[9px]">W</div>
                  <div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Wave</p>
                    <p className="text-xs font-black">79 05 28 86</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-accent font-black text-[9px]">À partir de 5 000 FCFA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black flex items-center gap-2">
                Preuve de paiement 
                <span className="text-[9px] font-normal text-muted-foreground">(Capture d'écran)</span>
            </Label>
            {screenshot ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-accent/20 shadow-lg">
                <img src={screenshot} alt="Screenshot" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => setScreenshot(null)} className="rounded-xl font-bold h-7 text-[10px]">Modifier</Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-muted/50 hover:border-accent/40 transition-all group"
              >
                <div className="bg-muted p-2.5 rounded-full group-hover:bg-accent/10 transition-colors">
                    <Camera className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ajouter la capture</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </div>
        </div>

        <div className="p-4 pt-0 bg-background">
          <Button 
            className="w-full h-11 rounded-xl font-black text-sm bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={!screenshot || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Envoi...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    <span>Envoyer ma preuve</span>
                </div>
            )}
          </Button>
          <p className="text-center text-[8px] text-muted-foreground mt-2 font-medium italic">
            Validation sous 2h par notre équipe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}