import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation stable de Genkit pour SuguMali.
 * On force apiVersion: 'v1' pour éviter les erreurs 404 (v1beta).
 * La clé est récupérée via plusieurs variables d'environnement pour plus de flexibilité (Vercel/Local).
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

if (typeof window === 'undefined') {
  console.log("[MAMI] Initialisation de l'IA. Clé détectée :", !!apiKey);
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
      apiVersion: 'v1', // Force l'utilisation de l'API stable pour éviter les 404
    }),
  ],
});
