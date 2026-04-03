'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth, useFirestore, useFirebaseApp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, User, Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { countryCodes } from '@/lib/country-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface PhoneLoginProps {
  mode: 'login' | 'signup';
}

export function PhoneLogin({ mode }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'otp' | 'loading'>('phone');
  const [loadingMsg, setLoadingMsg] = useState('Vérification en cours…');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  
  // useRef pour garder le verifier stable entre les renders
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
    };
  }, []);

  const initVerifier = () => {
    if (typeof window === 'undefined' || verifierRef.current) return;
    
    try {
      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          try { verifierRef.current?.clear(); } catch (_) {}
          verifierRef.current = null;
        },
      });
    } catch (e) {
      console.error("Failed to init ReCAPTCHA", e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSendOTP = async () => {
    if (!auth || !phoneNumber || isLoading || cooldown > 0) return;
    
    if (mode === 'signup' && !displayName.trim()) {
      toast({ variant: 'destructive', title: "Nom requis", description: "Veuillez entrer votre nom et prénom." });
      return;
    }

    const cleanNumber = phoneNumber.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;

    if (formattedNumber.length < 10) {
      toast({ variant: 'destructive', title: "Numéro invalide", description: "Format attendu : +223 XXXX XXXX" });
      return;
    }
    
    setIsLoading(true);
    initVerifier();

    try {
      // Envoi direct sans Cloud Function (évite les erreurs CORS et 503)
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifierRef.current!);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: `SMS envoyé au ${formattedNumber}` });
    } catch (error: any) {
      console.error("Firebase Phone Auth Error", error);
      
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }

      if (error.code === 'auth/too-many-requests') {
        setCooldown(60);
        toast({ variant: 'destructive', title: "Trop de tentatives", description: "Attendez 1 minute avant de réessayer." });
      } else if (error.code === 'auth/invalid-phone-number') {
        toast({ variant: 'destructive', title: "Numéro invalide", description: "Vérifiez le format du numéro." });
      } else {
        toast({ variant: 'destructive', title: "Échec de l'envoi", description: "Une erreur est survenue. Vérifiez votre connexion." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp || isLoading) return;
    setIsLoading(true);
    setLoadingMsg('Vérification du code…');
    setStep('loading');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      setLoadingMsg('Synchronisation du compte…');
      await user.getIdToken(true);

      setLoadingMsg('Vérification du profil…');
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      // LOGIQUE DEMANDÉE : Vérification post-OTP en mode login
      if (!userSnap.exists() && mode === 'login') {
        await signOut(auth);
        setStep('phone');
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: "Aucun compte trouvé",
          description: "Ce numéro n'est pas enregistré. Veuillez créer un compte.",
        });
        return;
      }

      // Mode signup -> créer le profil
      if (mode === 'signup') {
        setLoadingMsg('Création du profil…');
        let photoURL = user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`;

        if (profileImage && app) {
          try {
            setLoadingMsg('Upload de la photo…');
            const storage = getStorage(app);
            const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
            await uploadString(storageRef, profileImage, 'data_url');
            photoURL = await getDownloadURL(storageRef);
          } catch (storageErr) {
            console.error("Upload photo error:", storageErr);
          }
        }
        
        await updateProfile(user, { displayName, photoURL });

        const newUserPayload = {
          uid: user.uid,
          displayName,
          phoneNumber: user.phoneNumber,
          photoURL,
          isVerified: false,
          isBanned: false,
          createdAt: serverTimestamp(),
        };

        await setDoc(userRef, newUserPayload, { merge: true });
        toast({ title: 'Bienvenue sur SuguMali !', description: 'Compte créé avec succès.' });
      } else {
        toast({ title: 'Bon retour !', description: 'Connexion réussie.' });
      }

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Verification Error", error);
      setStep('otp');
      const messages: Record<string, string> = {
        'auth/invalid-verification-code': "Code incorrect. Vérifiez le SMS.",
        'auth/code-expired': "Code expiré. Renvoyez un nouveau SMS.",
      };
      toast({ 
        variant: 'destructive', 
        title: 'Vérification échouée', 
        description: messages[error.code] || "Code invalide ou expiré." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-2 border-accent/10 animate-ping" />
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-black text-base">{loadingMsg}</p>
          <p className="text-xs text-muted-foreground">{selectedDialCode} {phoneNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ReCAPTCHA container : Invisible mais présent dans le DOM */}
      <div id="recaptcha-container" className="fixed opacity-0 pointer-events-none"></div>
      
      {step === 'phone' && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {mode === 'signup' && (
            <>
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-1 ring-accent/10">
                    <AvatarImage src={profileImage || undefined} className="object-cover" />
                    <AvatarFallback className="bg-accent/5 text-accent">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-accent text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-1">Photo</p>
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM COMPLET</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="Sekou Tieta" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TÉLÉPHONE</Label>
            <div className="flex gap-2">
              <div className="w-[100px] shrink-0">
                <Select value={selectedDialCode} onValueChange={setSelectedCountryCode}>
                  <SelectTrigger className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none focus:ring-accent/20 font-bold text-sm">
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
            disabled={isLoading || !phoneNumber || (mode === 'signup' && !displayName.trim()) || cooldown > 0}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : cooldown > 0 ? (
              `Réessayer (${cooldown}s)`
            ) : (
              <><ArrowRight className="mr-2 h-5 w-5" /> Continuer</>
            )}
          </Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
          <div className="text-center space-y-1 mb-2">
            <h3 className="font-black text-lg">Vérification</h3>
            <p className="text-xs text-muted-foreground">
              Code envoyé au <span className="font-bold text-accent">{selectedDialCode} {phoneNumber}</span>
            </p>
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
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <><ShieldCheck className="mr-2 h-5 w-5" /> Valider</>
            )}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-wider hover:text-accent"
            onClick={() => setStep('phone')} 
            disabled={isLoading}
          >
            Modifier le numéro
          </Button>
        </div>
      )}
    </div>
  );
}
