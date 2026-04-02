'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { PhoneLogin } from '@/components/auth/phone-login';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  useEffect(() => {
    if (!loading && user && !isCompletingProfile) {
      router.push('/dashboard');
    }
  }, [user, loading, router, isCompletingProfile]);

  if (loading || (user && !isCompletingProfile)) {
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
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="h-12 w-12" />
          <h1 className="text-3xl font-black tracking-tighter">Bienvenue sur <span className="text-accent">SuguMali</span></h1>
          <p className="text-muted-foreground font-medium">Connectez-vous pour commencer</p>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border shadow-xl shadow-accent/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-4">
            <GoogleAuthButton />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-card px-4 text-muted-foreground">OU</span>
            </div>
          </div>

          <div className="space-y-4">
            <PhoneLogin onProfileStep={() => setIsCompletingProfile(true)} />
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-6 leading-relaxed">
            En vous connectant, vous acceptez nos <a href="/terms" className="text-accent font-bold hover:underline">Conditions d'utilisation</a> et notre <a href="/privacy" className="text-accent font-bold hover:underline">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
