'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth, useFirestore, useFirebaseApp } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Loader2, User, Mail, Lock, Camera, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const signupSchema = z.object({
  fullName: z.string().min(3, { message: 'Le nom complet est requis' }),
  email: z.string().email({ message: 'Veuillez entrer une adresse e-mail valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      let photoURL = `https://picsum.photos/seed/${user.uid}/100/100`;

      // Upload de l'image si elle existe
      if (profileImage && app) {
        try {
          const storage = getStorage(app);
          const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
          await uploadString(storageRef, profileImage, 'data_url');
          photoURL = await getDownloadURL(storageRef);
        } catch (storageError) {
          console.error("Storage upload error:", storageError);
        }
      }

      await updateProfile(user, { 
        displayName: data.fullName,
        photoURL 
      });

      const userRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: data.fullName,
          email: user.email,
          photoURL: photoURL,
          isVerified: false,
          isBanned: false,
          bio: '',
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: "Compte créé !", description: "Bienvenue sur SuguMali 🇲🇱" });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Signup Error:", error);
      let message = "Échec de l'inscription.";
      if (error.code === 'auth/email-already-in-use') message = "Cet e-mail est déjà utilisé.";
      toast({ variant: 'destructive', title: "Erreur", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Sélecteur de Photo de Profil */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-1 ring-accent/10">
              <AvatarImage src={profileImage || undefined} className="object-cover" />
              <AvatarFallback className="bg-accent/5 text-accent">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">Photo de profil</p>
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
        </div>

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">NOM ET PRÉNOM</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="Sekou Tieta" 
                    {...field} 
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-MAIL</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="eliteb269@gmail.com" 
                    {...field} 
                    type="email"
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MOT DE PASSE</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <Input 
                    placeholder="••••••••••••" 
                    {...field} 
                    type="password"
                    className="h-14 rounded-2xl bg-[#E8F0FE]/50 border-none pl-12 font-medium focus-visible:ring-accent/20" 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-accent/20 transition-all active:scale-[0.98] mt-2" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
}
