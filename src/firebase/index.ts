'use client';

import { firebaseConfig } from './config'; // Assure-toi que le fichier config.ts existe dans le même dossier
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Initialisation de l'application Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. EXPORTATION DE DB (C'est ce qui règle l'erreur dans data.ts)
export const db = getFirestore(app);

// 3. Exportation de Auth (utile pour la connexion)
export const auth = getAuth(app);

// 4. Fonctions utilitaires pour tes providers
export function initializeFirebase() {
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// 5. Ré-exportation de tes modules existants
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';