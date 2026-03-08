import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Instance centrale Genkit pour SuguMali.
 * Gère la récupération robuste de la clé d'API Gemini.
 */
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
