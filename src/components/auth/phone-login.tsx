'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth, useFirestore, useFirebaseApp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, AlertTriangle, User, Camera } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { countryCodes } from '@/lib/country-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PhoneLoginProps {
  onProfileStep?: () => void;
}

export function PhoneLogin({ onProfileStep }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth || !recaptchaRef.current) return;
    
    const initRecaptcha = () => {
      try {
        if (verifierRef.current) {
          verifierRef.current.clear();
        }

        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current!, {
          size: 'invisible',
          'callback': () => {
            console.log('ReCAPTCHA validé');
          }
        });
      } catch (error) {
        console.error("Erreur lors de l'initialisation du ReCAPTCHA:", error);
      }
    };

    initRecaptcha();

    return () => {
      if (verifierRef.current) {
        try {
          verifierRef.current.clear();
        } catch (e) {}
        verifierRef.current = null;
      }
    };
  }, [auth]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSendOTP = async () => {
    if (!auth || !phoneNumber || !displayName.trim() || isLoading) {
      if (!displayName.trim()) toast({ variant: 'destructive', title: "Nom requis", description: "Veuillez entrer votre nom et prénom." });
      return;
    }
    setIsLoading(true);
    setRegionError(null);

    try {
      if (!verifierRef.current) {
        throw new Error("Le vérificateur de sécurité n'est pas prêt. Veuillez rafraîchir la page.");
      }

      const cleanNumber = phoneNumber.replace(/\s/g, '');
      const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, verifierRef.current);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ 
        title: 'Code envoyé !', 
        description: `Un SMS a été envoyé au ${formattedNumber}` 
      });
    } catch (error: any) {
      console.error("Erreur d'envoi SMS Firebase:", error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setRegionError("L'envoi de SMS vers cette région n'est pas activé dans votre console Firebase.");
      } else if (error.code === 'auth/too-many-requests') {
        toast({ 
          variant: 'destructive', 
          title: "Trop de tentatives", 
          description: "Veuillez patienter quelques minutes avant de réessayer."
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Échec de l'envoi", 
          description: "Veuillez vérifier le numéro et réessayer."
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

      // Création/Mise à jour automatique du profil
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        let photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;

        // Upload de l'image si sélectionnée
        if (profileImage && app) {
          try {
            const storage = getStorage(app);
            const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
            await uploadString(storageRef, profileImage, 'data_url');
            photoURL = await getDownloadURL(storageRef);
          } catch (storageErr) {
            console.error("Storage upload error:", storageErr);
          }
        }
        
        await updateProfile(user, {
          displayName: displayName,
          photoURL: photoURL
        });

        await setDoc(userRef, {
          uid: user.uid,
          displayName: displayName,
          phoneNumber: user.phoneNumber,
          photoURL: photoURL,
          isVerified: false,
          isBanned: false,
          createdAt: serverTimestamp(),
        });
        
        toast({ title: 'Bienvenue sur SuguMali !', description: 'Votre compte a été créé avec succès.' });
      } else {
        toast({ title: 'Bon retour !', description: 'Connexion réussie.' });
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Erreur vérification OTP:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Code incorrect', 
        description: "Le code saisi n'est pas valide ou a expiré." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div id="recaptcha-container" ref={recaptchaRef}></div>
      
      {regionError && step === 'phone' && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">Action requise (Admin)</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Activez le <strong>Mali (+223)</strong> dans : 
            <br/><code className="bg-black/10 px-1 rounded">Console Firebase &gt; Auth &gt; Settings &gt; SMS Region Policy</code>
          </AlertDescription>
        </Alert>
      )}

      {step === 'phone' && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Photo de Profil */}
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
            <p className="text-[9px] font-black text-accent uppercase tracking-widest mt-1">Ma Photo</p>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>

          {/* Nom et Prénom */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM ET PRÉNOM</Label>
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

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NUMÉRO DE TÉLÉPHONE</Label>
            <div className="flex gap-2">
              <div className="w-[100px] shrink-0">
                <Select value={selectedDialCode} onValueChange={setSelectedCountryCode}>
                  <SelectTrigger className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none focus:ring-accent/20 font-bold text-sm">
                    <SelectValue placeholder="Pays" />
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
            disabled={isLoading || !phoneNumber || !displayName.trim()}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ArrowRight className="mr-2 h-5 w-5" /> S'inscrire par téléphone</>}
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
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CODE DE VALIDATION</Label>
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
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Valider mon compte</>}
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-wider hover:text-accent"
            onClick={() => { setStep('phone'); setRegionError(null); }}
            disabled={isLoading}
          >
            Modifier les informations
          </Button>
        </div>
      )}
    </div>
  );
}
