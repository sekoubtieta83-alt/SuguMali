'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé
    if (!auth) {
      return;
    }

    // Vérifier les paramètres
    const uid = searchParams.get('uid');
    const phone = searchParams.get('phone');

    if (!uid || !phone) {
      // Pas de paramètres → redirection vers login
      router.push('/login');
      return;
    }

    // Vérifier que l'utilisateur courant correspond à l'UID
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Pas d'utilisateur authentifié → redirection vers login
        router.push('/login');
      } else if (user.uid !== uid) {
        // UID ne correspond pas → redirection vers login
        router.push('/login');
      } else {
        // ✅ Tout est bon, on peut afficher la page
        setIsReady(true);
      }
    });

    return () => unsubscribe();
  }, [auth, router, searchParams]);

  // Pendant le chargement, afficher un spinner
  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full border-2 border-accent/10 animate-ping" />
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
          </div>
        </div>
        <p className="font-black text-base mt-6 animate-pulse">Vérification de sécurité…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
