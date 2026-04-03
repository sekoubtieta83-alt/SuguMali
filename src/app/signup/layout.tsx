'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';

function SignupLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const uid = searchParams.get('uid');
    const phone = searchParams.get('phone');

    if (!uid || !phone) {
      router.push('/login');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      } else if (user.uid !== uid) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    });

    return () => unsubscribe();
  }, [auth, router, searchParams]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-2 border-accent/10 animate-ping" />
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          </div>
        </div>
        <p className="font-black text-base mt-6 animate-pulse text-foreground">Vérification de sécurité…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-12 text-foreground">
      <div className="w-full max-w-md bg-card p-8 rounded-[2.5rem] shadow-2xl shadow-primary/5 border animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SignupLayoutInner>{children}</SignupLayoutInner>
    </Suspense>
  );
}