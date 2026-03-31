'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';

// 1. Initialisation de l'application Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * 2. INITIALISATION OPTIMISÉE DE FIRESTORE
 * - persistence: active le cache local pour un chargement instantané (hors ligne supporté)
 * - autoDetectLongPolling: améliore la stabilité sur les réseaux instables
 */
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalAutoDetectLongPolling: true, // Meilleure stabilité de connexion
});

// 3. Exportation de Auth
export const auth = getAuth(app);

// 4. Fonctions utilitaires pour les providers
export function initializeFirebase() {
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: db
  };
}

// 5. Ré-exportation des modules
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
