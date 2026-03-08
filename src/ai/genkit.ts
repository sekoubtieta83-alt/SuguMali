
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de Genkit avec le plugin Google AI.
 * Nous testons plusieurs variables d'environnement courantes pour maximiser la compatibilité avec Vercel et Firebase.
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
  model: 'googleai/gemini-1.5-flash',
});
