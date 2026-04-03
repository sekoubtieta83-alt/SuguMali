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
import { Loader2, Phone, ShieldCheck, ArrowRight, MessageSquareCode, User, Camera, Mail, ShoppingBag, LayoutGrid, CheckCircle2 } from 'lucide-react';
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
import { categories } from '@/lib/categories';

interface PhoneLoginProps {
  mode: 'login' | 'signup';
}

type Step = 'phone' | 'otp' | 'profile' | 'loading';

export function PhoneLogin({ mode }: PhoneLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDialCode, setSelectedCountryCode] = useState('+223');
  const [otp, setOtp] = useState('');
  
  // Champs Profil (pour l'inscription)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Vérification en cours…');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          verifierRef.current?.clear();
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
    if (!auth || !phoneNumber || isLoading) return;
    
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `${selectedDialCode}${cleanNumber}`;

    if (formattedNumber.length < 10) {
      toast({ variant: 'destructive', title: "Numéro invalide", description: "Veuillez entrer un numéro valide." });
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
      console.error("Firebase Phone Auth Error", error);
      if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
      toast({ variant: 'destructive', title: "Échec de l'envoi", description: "Vérifiez votre numéro ou réessayez plus tard." });
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

      // Synchroniser le token pour les lectures Firestore
      await user.getIdToken(true);

      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (mode === 'login') {
        if (!userSnap.exists()) {
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
        toast({ title: 'Bon retour !', description: 'Connexion réussie.' });
        router.push('/dashboard');
      } else {
        // Mode Signup
        if (userSnap.exists()) {
          toast({ title: 'Compte existant', description: 'Vous êtes déjà inscrit. Redirection...' });
          router.push('/dashboard');
        } else {
          setStep('profile');
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error("OTP Verification Error", error);
      setStep('otp');
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Code invalide', description: "Le code saisi est incorrect." });
    }
  };

  const onFinalizeSignup = async () => {
    const user = auth.currentUser;
    if (!user || !firestore || isLoading) return;

    if (!firstName || !lastName || !email || !shopName || !category) {
      toast({ variant: 'destructive', title: "Champs requis", description: "Veuillez remplir toutes les informations." });
      return;
    }

    setIsLoading(true);
    setStep('loading');
    setLoadingMsg('Création de votre boutique…');

    try {
      let photoURL = user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`;

      if (profileImage && app) {
        setLoadingMsg('Upload de votre photo…');
        const storage = getStorage(app);
        const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
        await uploadString(storageRef, profileImage, 'data_url');
        photoURL = await getDownloadURL(storageRef);
      }

      const displayName = `${firstName} ${lastName}`;
      await updateProfile(user, { displayName, photoURL });

      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        firstName,
        lastName,
        email,
        shopName,
        category,
        phoneNumber: user.phoneNumber,
        photoURL,
        isVerified: false,
        isBanned: false,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Bienvenue sur SuguMali !', description: 'Votre compte a été créé avec succès.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup Finalization Error", error);
      setStep('profile');
      setIsLoading(false);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de créer le profil." });
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
        <div className="text-center space-y-2">
          <p className="font-black text-base">{loadingMsg}</p>
        </div>
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
            <h3 className="font-black text-lg">Code de vérification</h3>
            <p className="text-xs text-muted-foreground">Envoyé au <span className="font-bold text-accent">{selectedDialCode} {phoneNumber}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CODE REÇU PAR SMS</Label>
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
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Valider le code</>}
          </Button>
          <Button variant="ghost" className="w-full text-[10px] font-black text-muted-foreground uppercase hover:text-accent" onClick={() => setStep('phone')} disabled={isLoading}>Modifier le numéro</Button>
        </div>
      )}

      {step === 'profile' && (
        <div className="space-y-5 animate-in fade-in duration-500 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-1 ring-accent/10">
                <AvatarImage src={profileImage || undefined} className="object-cover" />
                <AvatarFallback className="bg-accent/5 text-accent"><User className="h-8 w-8" /></AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-accent text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"><Camera className="h-3 w-3" /></button>
            </div>
            <p className="text-[9px] font-black text-accent uppercase tracking-widest">Ajouter une photo</p>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PRÉNOM</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input placeholder="Jean" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-10 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input placeholder="Dupont" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-10 text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-MAIL</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM DE VOTRE BOUTIQUE</Label>
            <div className="relative">
              <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input placeholder="Ex: Boutique Sugu" value={shopName} onChange={e => setShopName(e.target.value)} className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CATÉGORIE D'ACTIVITÉ</Label>
            <div className="relative">
              <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm font-medium focus:ring-accent/20">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98] mt-4" 
            onClick={onFinalizeSignup}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Créer mon compte</>}
          </Button>
        </div>
      )}
    </div>
  );
}
