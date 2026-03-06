'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithRedirect, getRedirectResult, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '../logo';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Loader2, AlertCircle } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(1, { message: 'Le nom complet est requis' }),
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide.' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 48 48"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691c-1.219 2.44-1.936 5.25-1.936 8.309s.717 5.869 1.936 8.309l7.707-6.002c-.39-.94-.636-1.97-.636-3.054s.246-2.114.636-3.054z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-4.819c-1.745 1.16-3.956 1.858-6.319 1.858c-4.661 0-8.656-3.007-10.079-7.02l-7.707 6.002C9.516 39.544 16.22 44 24 44"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l6.19 4.819c3.424-3.175 5.594-7.916 5.594-13.393c0-1.341-.138-2.65-.389-3.917"
      />
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.05 20.28c-.98.95-2.05 1.72-3.21 1.72-1.13 0-1.51-.68-2.84-.68-1.33 0-1.78.65-2.84.68-1.08.03-2.11-.8-3.15-1.75-2.13-1.93-3.75-5.46-3.75-8.77 0-3.3 2.05-5.05 4.02-5.05 1.05 0 2.03.62 2.68.62.64 0 1.75-.75 3.01-.75 1.05 0 2.37.54 3.12 1.48-2.09 1.25-1.74 4.15.35 5.25-.85 2.12-2.02 4.35-3.39 5.25zm-2.89-16.11c-.57.69-1.51 1.19-2.39 1.13-.12-1 .31-2.02.89-2.7.59-.69 1.57-1.17 2.38-1.13.13 1.01-.31 2.01-.88 2.7z" />
    </svg>
  );
}

export function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkRedirect = async () => {
      if (!auth || !firestore) {
        if (mounted) setIsSocialLoading(false);
        return;
      }
      
      try {
        const result = await getRedirectResult(auth);
        if (result && mounted) {
          const user = result.user;
          const userRef = doc(firestore, 'users', user.uid);
          const docSnap = await getDoc(userRef);

          if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              displayName: user.displayName || 'Utilisateur SuguMali',
              email: user.email,
              photoURL: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
              isVerified: false,
              isBanned: false,
              bio: '',
              createdAt: serverTimestamp(),
            });
          }
          router.push('/dashboard');
        } else if (mounted) {
          setIsSocialLoading(false);
        }
      } catch (error: any) {
        if (mounted) {
          console.error("CODE ERREUR AUTH REDIRECT:", error.code);
          toast({
            variant: 'destructive',
            title: 'Échec de la connexion social',
            description: `Erreur (${error.code}) : ${error.message}`,
          });
          setIsSocialLoading(false);
        }
      }
    };

    checkRedirect();
    
    const timeout = setTimeout(() => {
      if (mounted) setIsSocialLoading(false);
    }, 7000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [auth, firestore, router, toast]);

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      await sendEmailVerification(user);
      
      const photoURL = `https://picsum.photos/seed/${user.uid}/100/100`;
      await updateProfile(user, { displayName: data.fullName, photoURL });

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        displayName: data.fullName,
        email: user.email,
        photoURL: photoURL,
        isVerified: false,
        isBanned: false,
        bio: '',
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Compte créé !",
        description: "Un e-mail de vérification vous a été envoyé. Vérifiez votre boîte de réception.",
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.log("CODE ERREUR FIREBASE (SIGNUP):", error.code);
      console.error("Signup error:", error);
      
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = "Cette adresse e-mail est déjà utilisée.";
      } else if (error.code === 'auth/invalid-email') {
        message = "L'adresse e-mail n'est pas valide.";
      } else if (error.code === 'auth/weak-password') {
        message = "Le mot de passe est trop faible.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "La méthode d'inscription par e-mail n'est pas activée dans la console Firebase.";
      }

      toast({
        variant: 'destructive',
        title: "Échec de l'inscription",
        description: `Code: ${error.code}. ${message}`,
      });
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSocialLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Google signin init error:", error.code);
      toast({
        variant: 'destructive',
        title: 'Erreur Google',
        description: `Impossible d'initier la connexion (${error.code}).`,
      });
      setIsSocialLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!auth) return;
    setIsSocialLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Apple signin init error:", error.code);
      toast({
        variant: 'destructive',
        title: 'Erreur Apple',
        description: `Impossible d'initier la connexion (${error.code}).`,
      });
      setIsSocialLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-3xl border-none">
      <CardHeader className="space-y-1 text-center pt-8">
         <div className="flex justify-center items-center gap-2">
            <Logo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-black tracking-tighter">SuguMali</CardTitle>
        </div>
        <CardDescription className="text-base">
          Créez votre compte SuguMali gratuitement
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 px-8 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
             <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Nom et prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} className="h-[55px] rounded-xl bg-muted/30 border-none px-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} className="h-[55px] rounded-xl bg-muted/30 border-none px-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="h-[55px] rounded-xl bg-muted/30 border-none px-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-[55px] rounded-xl text-base mt-2 shadow-lg shadow-accent/20" disabled={isLoading || isSocialLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Créer un compte
            </Button>
          </form>
        </Form>
        <div className="relative my-2">
          <Separator />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-card text-xs font-bold text-muted-foreground uppercase tracking-widest">
            OU
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Button variant="outline" className="h-[55px] rounded-xl border-border font-semibold text-base bg-white text-black hover:bg-gray-50 flex items-center justify-center gap-3" onClick={handleGoogleSignIn} disabled={isSocialLoading || isLoading}>
             {isSocialLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-6 w-6" />}
            Continuer avec Google
          </Button>
          <Button variant="outline" className="h-[55px] rounded-xl border-none font-semibold text-base bg-black text-white hover:bg-black/90 flex items-center justify-center gap-3" onClick={handleAppleSignIn} disabled={isSocialLoading || isLoading}>
             {isSocialLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AppleIcon className="h-6 w-6 text-white" />}
            Continuer avec Apple
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="font-bold text-accent hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
