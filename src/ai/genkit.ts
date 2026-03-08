
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de Genkit pour SuguMali.
 * Version stabilisée pour éviter les erreurs de routage.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
      apiVersion: 'v1', // Utilisation de l'API stable v1
    }),
  ],
});
