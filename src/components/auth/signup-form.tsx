
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider, 
  signInWithRedirect,
  updateProfile
} from 'firebase/auth';
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
import { Loader2, AlertCircle, User, Smartphone } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(3, { message: 'Le nom complet est requis' }),
  phoneNumber: z.string().min(8, { message: 'Numéro invalide (ex: 76000000)' }),
});

const otpSchema = z.object({
  code: z.string().length(6, { message: 'Le code doit contenir 6 chiffres.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function SignupForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [tempUserData, setTempUserData] = useState<SignupFormValues | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-signup', {
      size: 'invisible',
    });
    setRecaptchaVerifier(verifier);

    return () => verifier.clear();
  }, [auth]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSendCode = async (data: SignupFormValues) => {
    if (!auth || !recaptchaVerifier) return;
    setIsLoading(true);
    try {
      const fullNumber = `+223${data.phoneNumber.replace(/\s/g, '')}`;
      const result = await signInWithPhoneNumber(auth, fullNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setTempUserData(data);
      toast({
        title: "Code envoyé !",
        description: "Veuillez saisir le code reçu par SMS.",
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'envoyer le SMS." });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyAndCreate = async (data: OtpFormValues) => {
    if (!confirmationResult || !tempUserData || !firestore || !auth) return;
    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(data.code);
      const user = userCredential.user;

      const photoURL = `https://picsum.photos/seed/${user.uid}/100/100`;
      await updateProfile(user, { 
        displayName: tempUserData.fullName,
        photoURL 
      });

      const userRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: tempUserData.fullName,
          phoneNumber: user.phoneNumber,
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
      toast({ variant: 'destructive', title: "Erreur", description: "Code invalide." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur Google', description: "Échec de l'inscription." });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-3xl border-none">
      <div id="recaptcha-signup"></div>
      <CardHeader className="space-y-1 text-center pt-8">
         <div className="flex justify-center items-center gap-2">
            <Logo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-black tracking-tighter">SuguMali</CardTitle>
        </div>
        <CardDescription className="text-base">
          {confirmationResult ? "Finalisation de l'inscription" : "Créez votre compte en 1 minute"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 px-8 pb-10">
        {!confirmationResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSendCode)} className="grid gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Nom et prénom</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                        <Input placeholder="Jean Dupont" {...field} className="h-[55px] rounded-xl bg-muted/30 border-none pl-12" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-1">Numéro Malien</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 border-border/50 h-6">
                      <span className="text-sm font-bold text-foreground">🇲🇱 +223</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <Input 
                          placeholder="76 00 00 00" 
                          {...field} 
                          type="tel"
                          className="h-[55px] rounded-xl bg-muted/30 border-none pl-24 font-bold" 
                        />
                      )}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-black h-[55px] rounded-xl text-base mt-2 shadow-lg shadow-accent/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "S'inscrire"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onVerifyAndCreate)} className="grid gap-5">
              <FormField
                control={otpForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Code reçu par SMS</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                        <Input 
                          placeholder="000000" 
                          {...field} 
                          className="h-14 rounded-2xl bg-muted/50 border-none px-12 text-center text-2xl font-black tracking-[0.5em]" 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-accent/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmer'}
              </Button>
            </form>
          </Form>
        )}

        <div className="relative my-2">
          <Separator />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-card text-xs font-bold text-muted-foreground uppercase tracking-widest">
            OU
          </div>
        </div>
        <div className="grid grid-cols-1">
          <Button variant="outline" className="h-[55px] rounded-xl border-border font-semibold text-base bg-white text-black hover:bg-gray-50 flex items-center justify-center gap-3" onClick={handleGoogleSignIn} disabled={isLoading}>
             <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            Google
          </Button>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-bold text-accent hover:underline">
            Se connecter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
