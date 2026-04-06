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
import { useAuth, useFirestore, useFirebaseApp } from '@/firebase';
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
import { getFunctions, httpsCallable } from 'firebase/functions';

interface PhoneLoginProps {
  mode: 'login' | 'signup';
}

type Step = 'phone' | 'otp' | 'loading' | 'error';

export function PhoneLogin({ mode }: PhoneLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Vérification en cours…');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Nettoyage rigoureux du ReCAPTCHA pour éviter FirebaseError: internal
  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        try { 
          verifierRef.current.clear(); 
          const container = document.getElementById('recaptcha-container');
          if (container) container.innerHTML = '';
        } catch (_) {}
        verifierRef.current = null;
      }
    };
  }, []);

  const initVerifier = () => {
    if (typeof window === 'undefined' || !auth) return null;
    
    try {
      const container = document.getElementById('recaptcha-container');
      if (!container) return null;

      // Nettoyer toute instance existante avant d'en créer une nouvelle
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      
      verifierRef.current = verifier;
      return verifier;
    } catch (e) {
      console.error("Failed to init ReCAPTCHA", e);
      return null;
    }
  };

  const onSendOTP = async () => {
    if (!auth || !phoneNumber || isLoading || !app) return;
    
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;

    if (formattedNumber.length < 10) {
      toast({ variant: 'destructive', title: "Numéro invalide", description: "Veuillez entrer un numéro complet." });
      return;
    }
    
    setIsLoading(true);
    setLoadingMsg('Vérification du numéro...');

    try {
      // ACTION 1: Pré-vérification Firestore via Cloud Function
      const functions = getFunctions(app, 'europe-west1');
      const checkUserFn = httpsCallable(functions, 'checkUserByPhone');
      const result: any = await checkUserFn({ phoneNumber: formattedNumber });
      const exists = result.data.exists;

      // ACTION 2: Cas Mode Login -> Si n'existe pas, bloquer
      if (mode === 'login' && !exists) {
        setIsLoading(false);
        toast({ 
          variant: 'destructive',
          title: "Numéro inconnu", 
          description: "Ce numéro n'a pas de compte SuguMali. Redirection vers l'inscription..." 
        });
        setTimeout(() => {
          router.push(`/signup?phone=${encodeURIComponent(formattedNumber)}&uid=pending`);
        }, 2000);
        return;
      }

      // ACTION 3: Cas Mode Signup -> Si existe déjà, bloquer
      if (mode === 'signup' && exists) {
        setIsLoading(false);
        toast({ 
          variant: 'destructive',
          title: "Compte existant", 
          description: "Un compte existe déjà avec ce numéro. Veuillez vous connecter." 
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      // ACTION 4: Envoi du SMS si validé
      setLoadingMsg('Envoi du code de sécurité…');
      const verifier = initVerifier();
      if (!verifier) throw new Error("Erreur de sécurité (reCAPTCHA).");

      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: `SMS envoyé au ${formattedNumber}` });
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      if (verifierRef.current) { 
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
      
      let message = "Erreur technique lors de l'envoi du SMS.";
      if (error.code === 'auth/too-many-requests') message = "Trop de tentatives. Réessayez plus tard.";
      if (error.code === 'auth/internal-error') message = "Erreur interne Firebase. Vérifiez votre connexion.";
      
      toast({ variant: 'destructive', title: "Échec", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp || isLoading || !auth || !firestore) return;
    
    setIsLoading(true);
    setStep('loading');
    setLoadingMsg('Vérification du code…');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      setLoadingMsg('Vérification du compte SuguMali…');
      
      // Petit délai pour Firestore
      await new Promise(resolve => setTimeout(resolve, 500));

      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        toast({ title: 'Connexion réussie', description: `Bienvenue, ${userSnap.data().displayName} !` });
        router.push('/dashboard');
      } else {
        // Sécurité : Si pas de profil, déconnexion immédiate
        await signOut(auth);
        setStep('error');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      setStep('otp');
      setIsLoading(false);
      
      let message = "Le code est incorrect ou expiré.";
      if (error.code === 'auth/code-expired') message = "Le code a expiré. Veuillez en renvoyer un.";
      
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
        <p className="font-black text-base text-center px-4 text-foreground">{loadingMsg}</p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 text-center animate-in zoom-in-95">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-xl font-black text-destructive">Compte introuvable</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vous n'avez pas de compte enregistré sur ce numéro.
          </p>
        </div>
        <Button 
          className="bg-accent hover:bg-accent/90 rounded-xl font-black px-8 h-12"
          onClick={() => {
            const fullPhone = selectedDialCode + phoneNumber.replace(/\s/g, '');
            router.push(`/signup?phone=${encodeURIComponent(fullPhone)}&uid=pending`);
          }}
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Créer mon profil maintenant
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <div id="recaptcha-container" className="fixed bottom-0 right-0 opacity-0 pointer-events-none"></div>
      
      {step === 'phone' && (
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">VOTRE TÉLÉPHONE</Label>
            <div className="flex gap-2">
              <div className="w-[100px] shrink-0">
                <Select value={selectedDialCode} onValueChange={setSelectedCountryCode}>
                  <SelectTrigger className="h-14 rounded-2xl bg-muted border-none focus:ring-accent/20 font-bold">
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
                  className="h-14 rounded-2xl bg-muted border-none pl-12 font-medium text-lg focus-visible:ring-accent/20"
                  type="tel"
                />
              </div>
            </div>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/30 transition-all active:scale-[0.98] border-none" 
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
                className="h-14 rounded-2xl bg-muted border-none pl-12 text-center text-xl font-black tracking-[0.5em] focus-visible:ring-accent/20" 
              />
            </div>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/30 transition-all active:scale-[0.98] border-none" 
            onClick={onVerifyOTP}
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Valider</>}
          </Button>
          <Button variant="ghost" className="w-full text-[10px] font-black text-muted-foreground uppercase hover:text-accent" onClick={() => setStep('phone')} disabled={isLoading}>Changer le numéro</Button>
        </div>
      )}
    </div>
  );
}
