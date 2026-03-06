'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/firebase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Card';
import { Input } from '@/components/ui/input';
import { Logo } from '../logo';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Loader2, AlertCircle, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide.' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    setAuthError(null);
    
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue sur SuguMali !',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Firebase Auth Error:", error.code);
      
      let message = "Une erreur est survenue.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = "Email ou mot de passe incorrect.";
          break;
        case 'auth/too-many-requests':
          message = "Trop de tentatives. Veuillez patienter.";
          break;
        default:
          message = "Impossible de se connecter. Vérifiez vos identifiants.";
      }

      setAuthError(message);
      toast({
        variant: 'destructive',
        title: 'Échec',
        description: message,
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: 'Connexion Google réussie',
        description: 'Bienvenue sur SuguMali !',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        variant: 'destructive',
        title: 'Erreur Google',
        description: "Impossible de se connecter avec Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-[2.5rem] border-none bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="h-2 bg-[#FF8C00]" />
      <CardHeader className="space-y-2 text-center pt-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <Logo className="h-12 w-12" />
          <CardTitle className="text-4xl font-black tracking-tighter text-foreground">Sugu<span className="text-[#FF8C00]">Mali</span></CardTitle>
        </div>
        <CardDescription className="text-base font-medium opacity-70">
          Le Mali achète et vend ici 🇲🇱
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6 px-8 pb-12">
        {authError && (
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm flex gap-3 items-center border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{authError}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Adresse Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      <Input 
                        placeholder="votre@email.com" 
                        {...field} 
                        className="h-14 rounded-2xl bg-muted/50 border-none px-12 focus-visible:ring-[#FF8C00]/50 text-base" 
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
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                      <Input 
                        type="password" 
                        placeholder="••••••••"
                        {...field} 
                        className="h-14 rounded-2xl bg-muted/50 border-none px-12 focus-visible:ring-[#FF8C00]/50 text-base" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black h-14 rounded-2xl text-lg mt-2 shadow-xl shadow-[#FF8C00]/20 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Se connecter'}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <Separator className="bg-border/50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background/80 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            OU
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="h-14 rounded-2xl border-border/50 font-bold text-base hover:bg-muted/50 flex items-center justify-center gap-3 transition-all" 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          type="button"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuer avec Google
        </Button>
        
        <div className="text-center text-sm font-medium text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-black text-[#FF8C00] hover:underline underline-offset-4">
            S'inscrire
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
