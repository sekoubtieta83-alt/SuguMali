import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation robuste de Genkit pour SuguMali.
 * On force apiVersion: 'v1' pour éviter les erreurs 404 liées aux anciennes routes v1beta.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (typeof window === 'undefined') {
  console.log("[GENKIT] Initialisation v1 stable. Clé API détectée :", !!apiKey);
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
      apiVersion: 'v1', // Force l'utilisation de l'API stable
    }),
  ],
});
