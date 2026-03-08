import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation robuste de Genkit pour SuguMali.
 * On force l'utilisation de l'API v1 stable pour éviter les erreurs 404 v1beta.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (typeof window === 'undefined') {
  console.log("[GENKIT] Initialisation v1 stable. Clé API détectée :", !!apiKey);
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
