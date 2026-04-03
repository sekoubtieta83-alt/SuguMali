'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, AlertCircle, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { countryCodes } from '@/lib/country-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneLoginProps {
  mode: 'login' | 'signup';
}

type Step = 'phone' | 'otp' | 'loading' | 'no-account';

export function PhoneLogin({ mode: initialMode }: PhoneLoginProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Vérification en cours…');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
    };
  }, []);

  const initVerifier = () => {
    if (typeof window === 'undefined' || !auth) return;
    try {
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    } catch (e) {
      console.error("Failed to init ReCAPTCHA", e);
    }
  };

  const onSendOTP = async () => {
    if (!auth || !phoneNumber || isLoading) return;
    
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;

    if (formattedNumber.length < 10) {
      toast({ variant: 'destructive', title: "Numéro invalide", description: "Veuillez entrer un numéro complet." });
      return;
    }
    
    setIsLoading(true);
    initVerifier();

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifierRef.current!);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: `SMS envoyé au ${formattedNumber}` });
    } catch (error: any) {
      console.error("Firebase Phone Auth Error:", error);
      if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
      
      let message = "Erreur technique. Réessayez.";
      if (error.code === 'auth/too-many-requests') message = "Trop de tentatives. Attendez un moment.";
      if (error.code === 'auth/invalid-phone-number') message = "Format de numéro invalide.";
      
      toast({ variant: 'destructive', title: "Échec", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp || isLoading) return;
    setIsLoading(true);
    setLoadingMsg('Vérification du code…');
    const previousStep = step;
    setStep('loading');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Synchronisation forcée du token pour Firestore
      await user.getIdToken(true);

      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (mode === 'login') {
        if (!userSnap.exists()) {
          // ✅ SI PAS DE COMPTE EN MODE LOGIN : DÉCONNEXION + ÉCRAN NO-ACCOUNT
          await signOut(auth);
          setStep('no-account');
          setIsLoading(false);
          return;
        }
        // ✅ Compte existant : connexion réussie
        toast({ title: 'Bon retour !', description: 'Connexion réussie.' });
        router.push('/dashboard');
      } else {
        // Mode Signup
        if (userSnap.exists()) {
          toast({ title: 'Compte existant', description: 'Vous avez déjà un compte. Redirection...' });
          router.push('/dashboard');
        } else {
          // ✅ Nouvel utilisateur : Rediriger vers la page complète d'inscription
          router.push(`/signup?phone=${encodeURIComponent(user.phoneNumber || '')}&uid=${user.uid}`);
        }
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      setStep('otp');
      setIsLoading(false);
      
      let message = "Le code est incorrect.";
      if (error.code === 'auth/code-expired') message = "Le code a expiré. Renvoyez-en un.";
      
      toast({ variant: 'destructive', title: 'Erreur', description: message });
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-2 border-accent/10 animate-ping" />
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          </div>
        </div>
        <p className="font-black text-base">{loadingMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div id="recaptcha-container" className="fixed opacity-0 pointer-events-none"></div>
      
      {step === 'phone' && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VOTRE TÉLÉPHONE</Label>
            <div className="flex gap-2">
              <div className="w-[100px] shrink-0">
                <Select value={selectedDialCode} onValueChange={setSelectedCountryCode}>
                  <SelectTrigger className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none focus:ring-accent/20 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-[300px]">
                    {countryCodes.map((country) => (
                      <SelectItem key={`${country.code}-${country.dial_code}`} value={country.dial_code}>
                        <span className="mr-2">{country.flag}</span>
                        <span>{country.dial_code}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                <Input 
                  placeholder="79 05 28 86" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20 text-lg"
                  type="tel"
                />
              </div>
            </div>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98] mt-2" 
            onClick={onSendOTP}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> Continuer</>}
          </Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
          <div className="text-center space-y-1 mb-2">
            <h3 className="font-black text-lg">Vérification</h3>
            <p className="text-xs text-muted-foreground">Entrez le code envoyé au <span className="font-bold text-accent">{selectedDialCode} {phoneNumber}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CODE REÇU</Label>
            <div className="relative">
              <MessageSquareCode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
              <Input 
                placeholder="123456" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 text-center text-xl font-black tracking-[0.5em] focus-visible:ring-accent/20" 
              />
            </div>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]" 
            onClick={onVerifyOTP}
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Valider</>}
          </Button>
          <Button variant="ghost" className="w-full text-[10px] font-black text-muted-foreground uppercase hover:text-accent" onClick={() => setStep('phone')} disabled={isLoading}>Changer le numéro</Button>
        </div>
      )}

      {step === 'no-account' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center py-4">
          <div className="bg-destructive/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">Compte introuvable</h3>
            <p className="text-sm text-muted-foreground leading-relaxed px-4">
              Désolé, aucun compte SuguMali n'est associé au numéro <span className="font-bold text-foreground">{selectedDialCode} {phoneNumber}</span>.
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <Button 
              className="w-full h-14 rounded-2xl font-black text-base bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
              onClick={() => {
                setMode('signup');
                setStep('phone');
                router.push('/signup');
              }}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Créer mon compte maintenant
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-xs font-bold text-muted-foreground uppercase tracking-widest"
              onClick={() => { setStep('phone'); setMode('login'); }}
            >
              Essayer un autre numéro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
