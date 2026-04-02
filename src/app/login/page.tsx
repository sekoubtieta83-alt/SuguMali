'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { PhoneLogin } from '@/components/auth/phone-login';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

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
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="h-12 w-12" />
          <h1 className="text-3xl font-black tracking-tighter">Bienvenue sur <span className="text-accent">SuguMali</span></h1>
          <p className="text-muted-foreground font-medium">Choisissez votre méthode de connexion</p>
        </div>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-2xl h-14">
            <TabsTrigger value="google" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-full">
              🔵 Google
            </TabsTrigger>
            <TabsTrigger value="phone" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm h-full">
              📱 Téléphone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-8 rounded-[2.5rem] border shadow-xl shadow-accent/5">
              <GoogleAuthButton />
              <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
                En vous connectant, vous acceptez nos <a href="/terms" className="text-accent font-bold hover:underline">Conditions d'utilisation</a>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="phone" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-8 rounded-[2.5rem] border shadow-xl shadow-accent/5">
              <PhoneLogin />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
