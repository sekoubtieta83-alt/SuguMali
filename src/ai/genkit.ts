import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation robuste de Genkit pour SuguMali.
 * On teste plusieurs variables d'environnement pour assurer la compatibilité avec Vercel.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (typeof window === 'undefined') {
  console.log("[GENKIT] Initialisation du module. Clé API détectée :", !!apiKey);
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
