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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
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
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const initRecaptcha = async () => {
    if (!auth || typeof window === 'undefined') return;
    
    try {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }

      // Attendre un cycle de rendu
      await new Promise(resolve => setTimeout(resolve, 100));

      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('ReCAPTCHA challenge solved'),
        'expired-callback': () => {
          console.warn('ReCAPTCHA expired, re-initializing...');
          initRecaptcha();
        }
      });

      await verifierRef.current.render();
      console.log('ReCAPTCHA correctly initialized');
    } catch (error: any) {
      console.error("ReCAPTCHA Initialization Error:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSendOTP = async () => {
    if (!auth || !firestore || !phoneNumber || isLoading || cooldown > 0) return;
    
    if (mode === 'signup' && !displayName.trim()) {
      toast({ variant: 'destructive', title: "Nom requis", description: "Veuillez entrer votre nom et prénom." });
      return;
    }

    const cleanNumber = phoneNumber.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;

    if (formattedNumber.length < 10) {
      toast({ variant: 'destructive', title: "Numéro invalide", description: "Format: +223 XXXX XXXX" });
      return;
    }
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const functions = getFunctions(getApp(), 'europe-west1');
        const checkUserByPhone = httpsCallable(functions, 'checkUserByPhone');
        const checkResult: any = await checkUserByPhone({ phoneNumber: formattedNumber });
        
        if (!checkResult.data?.exists) {
          toast({ variant: 'destructive', title: "Compte introuvable", description: "Ce numéro n'est pas inscrit." });
          setIsLoading(false);
          return;
        }
      }

      await initRecaptcha();
      
      if (!verifierRef.current) throw new Error("Système de sécurité indisponible.");
      
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifierRef.current);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'Code envoyé !', description: `SMS envoyé au ${formattedNumber}` });
    } catch (error: any) {
      // Diagnostic profond amélioré
      console.error("Firebase Phone Auth Error:", error);
      
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }

      if (error.code === 'auth/too-many-requests') {
        setCooldown(60);
        toast({ variant: 'destructive', title: "Anti-spam actif", description: "Attends 1 minute." });
      } else if (error.code === 'auth/invalid-phone-number') {
        toast({ variant: 'destructive', title: "Numéro invalide", description: "Vérifiez le format du numéro." });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Échec de l'envoi", 
          description: error.message || "Vérifiez votre connexion ou réessayez plus tard." 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!confirmationResult || !otp || isLoading) return;
    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      await user.getIdToken(true);

      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef).catch(async (serverError) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: userRef.path,
              operation: 'get'
          }));
          throw serverError;
      });
      
      if (!userSnap.exists() && mode === 'login') {
          await signOut(auth);
          toast({ variant: 'destructive', title: "Profil incomplet", description: "Veuillez vous inscrire." });
          setIsLoading(false);
          setStep('phone');
          return;
      }

      if (mode === 'signup') {
        let photoURL = user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`;

        if (profileImage && app) {
          try {
            const storage = getStorage(app);
            const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
            await uploadString(storageRef, profileImage, 'data_url');
            photoURL = await getDownloadURL(storageRef);
          } catch (storageErr) {
            console.error("Upload error:", storageErr);
          }
        }
        
        await updateProfile(user, { displayName, photoURL });

        const newUserPayload = {
          uid: user.uid,
          displayName: displayName,
          phoneNumber: user.phoneNumber,
          photoURL: photoURL,
          isVerified: false,
          isBanned: false,
          createdAt: serverTimestamp(),
        };

        await setDoc(userRef, newUserPayload, { merge: true }).catch(async (serverError) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
                requestResourceData: newUserPayload
            }));
        });
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast({ variant: 'destructive', title: 'Code invalide', description: "Vérifiez le code reçu." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Container ReCAPTCHA invisible mais présent dans le layout */}
      <div id="recaptcha-container" className="opacity-0 pointer-events-none fixed bottom-0"></div>
      
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
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : cooldown > 0 ? `Réessayer (${cooldown}s)` : <><ArrowRight className="mr-2 h-5 w-5" /> Continuer</>}
          </Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
          <div className="text-center space-y-1 mb-2">
            <h3 className="font-black text-lg">Vérification</h3>
            <p className="text-xs text-muted-foreground">Code envoyé au <span className="font-bold text-accent">{selectedDialCode} {phoneNumber}</span></p>
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
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Valider"}
          </Button>

          <Button variant="ghost" className="w-full text-[10px] font-black text-muted-foreground uppercase" onClick={() => setStep('phone')} disabled={isLoading}>
            Modifier le numéro
          </Button>
        </div>
      )}
    </div>
  );
}
