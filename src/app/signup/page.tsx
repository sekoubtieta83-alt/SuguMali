'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, useFirebaseApp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Camera, Mail, ShoppingBag, LayoutGrid, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { categories } from '@/lib/categories';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const phoneNumber = searchParams.get('phone') || '';
  const uid = searchParams.get('uid') || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Création de votre profil…');

  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const user = auth?.currentUser;
    if (!user || !firestore || isLoading) return;

    // Vérifications de base
    if (!firstName || !lastName || !email || !shopName || !category) {
      toast({ variant: 'destructive', title: "Champs requis", description: "Veuillez remplir toutes les informations." });
      return;
    }

    setIsLoading(true);
    setLoadingMsg('Création de votre profil…');

    try {
      let photoURL = user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`;

      // Upload de la photo de profil si présente
      if (profileImage && app) {
        setLoadingMsg('Upload de votre photo…');
        const storage = getStorage(app);
        const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
        await uploadString(storageRef, profileImage, 'data_url');
        photoURL = await getDownloadURL(storageRef);
      }

      // Mettre à jour le profil Firebase Auth pour l'affichage immédiat
      const displayName = `${firstName} ${lastName}`;
      await updateProfile(user, { displayName, photoURL });

      // Création du document utilisateur final dans Firestore
      setLoadingMsg('Enregistrement de vos informations…');
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        firstName,
        lastName,
        email,
        shopName,
        category,
        phoneNumber: user.phoneNumber || phoneNumber,
        photoURL,
        isVerified: false,
        isBanned: false,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Bienvenue sur SuguMali !', description: 'Votre compte est prêt.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup Submission Error:", error);
      setIsLoading(false);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible de finaliser l'inscription." });
    }
  };

  const handleGoBack = async () => {
    if (auth?.currentUser) {
      await signOut(auth);
    }
    router.push('/login');
  };

  if (isLoading) {
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
    <div className="w-full space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-black">Créer mon profil</h1>
          <p className="text-xs text-muted-foreground mt-1">Dernière étape avant de démarrer</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleGoBack}
          className="rounded-full h-10 w-10 hover:bg-accent/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Affichage du téléphone vérifié */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-3 flex justify-between items-center">
        <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Numéro vérifié</p>
        <p className="text-sm font-black text-foreground">{phoneNumber}</p>
      </div>

      {/* Formulaire */}
      <div className="space-y-5">
        {/* Photo de profil */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-1 ring-accent/10">
              <AvatarImage src={profileImage || undefined} className="object-cover" />
              <AvatarFallback className="bg-accent/5 text-accent"><User className="h-8 w-8" /></AvatarFallback>
            </Avatar>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-0 right-0 bg-accent text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[9px] font-black text-accent uppercase tracking-widest">Photo de profil</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Prénom et Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PRÉNOM</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input 
                placeholder="Jean" 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-10 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input 
                placeholder="Dupont" 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-10 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-MAIL</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input 
              type="email" 
              placeholder="votre@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm"
            />
          </div>
        </div>

        {/* Nom de la boutique */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM DE LA BOUTIQUE</Label>
          <div className="relative">
            <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input 
              placeholder="Ex: Sugu Pro" 
              value={shopName} 
              onChange={e => setShopName(e.target.value)} 
              className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ACTIVITÉ</Label>
          <div className="relative">
            <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
              <SelectTrigger className="h-12 rounded-xl bg-[#E8F0FE]/50 border-none pl-11 text-sm font-medium focus:ring-accent/20">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bouton de soumission */}
      <div className="space-y-3 pt-4 border-t border-accent/10">
        <Button 
          className="w-full h-14 rounded-2xl font-black text-lg bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Créer mon profil</>}
        </Button>
        <Button 
          variant="ghost"
          className="w-full text-xs font-black text-muted-foreground uppercase tracking-widest"
          onClick={handleGoBack}
          disabled={isLoading}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
