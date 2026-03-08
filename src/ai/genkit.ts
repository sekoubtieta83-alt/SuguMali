
import { genkit } from '@genkit-ai/ai';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de Genkit pour SuguMali.
 * Utilisation de l'importation @genkit-ai/ai pour éviter les conflits de nom de fichier.
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
