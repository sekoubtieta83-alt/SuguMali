
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de l'instance Genkit pour SuguMali.
 * Le fichier est nommé 'mami-instance' pour éviter les conflits de noms avec le package 'genkit'.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
