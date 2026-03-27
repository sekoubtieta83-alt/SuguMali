'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Smartphone, Upload, CheckCircle2, Loader2, Info, Camera, Send, Rocket } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    if (!user || !firestore || !screenshot) return;
    setIsSubmitting(true);

    try {
      const requestsRef = collection(firestore, 'promotion_requests');
      await addDoc(requestsRef, {
        userId: user.uid,
        userName: user.displayName || 'Utilisateur',
        annonceId,
        annonceTitle,
        screenshotUrl: screenshot, // Stockage base64 pour le prototype
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
      console.error(error);
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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <div className="bg-accent p-8 text-white text-center relative overflow-hidden">
          <Rocket className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 rotate-12" />
          <DialogHeader>
            <DialogTitle className="text-3xl font-black mb-2">Booster l'annonce</DialogTitle>
            <DialogDescription className="text-white/90 font-medium text-sm leading-relaxed">
              Devenez prioritaire sur SuguMali et vendez jusqu'à 5x plus vite !
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-8 bg-background">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3" /> Instructions de paiement
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#FF8C00] rounded-full flex items-center justify-center text-white font-black text-xs">OM</div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Orange Money</p>
                    <p className="text-base font-black">76 00 00 00</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-accent font-black">5 000 FCFA</p>
                    <p className="text-[9px] text-muted-foreground">Frais inclus</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#1cbcfc] rounded-full flex items-center justify-center text-white font-black text-xs">W</div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Wave</p>
                    <p className="text-base font-black">76 11 11 11</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-accent font-black">5 000 FCFA</p>
                    <p className="text-[9px] text-muted-foreground">Frais inclus</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-black flex items-center gap-2">
                Preuve de paiement 
                <span className="text-[10px] font-normal text-muted-foreground">(Capture d'écran)</span>
            </Label>
            {screenshot ? (
              <div className="relative group rounded-3xl overflow-hidden border-2 border-accent/20 shadow-lg">
                <img src={screenshot} alt="Screenshot" className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" onClick={() => setScreenshot(null)} className="rounded-xl font-bold">Modifier</Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-muted-foreground/20 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-muted/50 hover:border-accent/40 transition-all group"
              >
                <div className="bg-muted p-4 rounded-full group-hover:bg-accent/10 transition-colors">
                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ajouter la capture</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </div>
        </div>

        <div className="p-6 pt-0 bg-background">
          <Button 
            className="w-full h-16 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={!screenshot || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Envoi en cours...</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    <span>Soumettre ma preuve</span>
                </div>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-4 font-medium italic">
            Validation sous 2h par notre équipe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}