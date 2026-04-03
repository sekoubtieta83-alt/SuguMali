'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { PhoneLogin } from '@/components/auth/phone-login';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { LoginForm } from '@/components/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
           <Skeleton className="h-10 w-3/4 mx-auto" />
           <Skeleton className="h-8 w-1/2 mx-auto" />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* En-tête avec Logo */}
        <div className="flex flex-col items-center gap-2 text-center mb-2">
          <div className="bg-card p-2 rounded-2xl shadow-sm border mb-2">
            <Logo className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Sugu<span className="text-accent">Mali</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm">Connectez-vous à votre compte</p>
        </div>

        {/* Card de Connexion */}
        <div className="bg-card p-8 rounded-[2.5rem] shadow-2xl shadow-primary/5 border space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {!showPhoneLogin ? (
            <>
              {/* 1. Email & Mot de Passe */}
              <LoginForm />

              {/* Séparateur */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                  <span className="bg-card px-4 text-muted-foreground/60">OU</span>
                </div>
              </div>

              {/* 2. Autres méthodes */}
              <div className="space-y-3">
                <GoogleAuthButton />
                
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-2 font-bold text-base hover:bg-accent/5 hover:border-accent/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-foreground"
                  onClick={() => setShowPhoneLogin(true)}
                >
                  <Phone className="h-5 w-5 text-accent" />
                  Connexion par téléphone
                </Button>
              </div>
            </>
          ) : (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <PhoneLogin mode="login" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[10px] font-bold text-muted-foreground mt-4 hover:text-accent"
                onClick={() => setShowPhoneLogin(false)}
              >
                Retour aux autres méthodes
              </Button>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-black text-accent hover:underline underline-offset-4">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
