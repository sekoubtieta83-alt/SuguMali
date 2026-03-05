
'use client';

import { ReactNode, useMemo, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FirebaseProvider } from './provider';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { app, auth, firestore } = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    // Note: Dans Firebase Studio, nous utilisons les instances de production.
    // La connexion aux émulateurs locaux est désactivée pour éviter les erreurs de réseau (unavailable).

    return { app, auth, firestore };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful, scope is:', registration.scope);
        })
        .catch((err) => {
          console.log('Service Worker registration failed, error:', err);
        });
    }
  }, []);

  return (
    <FirebaseProvider value={{ app, auth, firestore }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseProvider>
  );
}
