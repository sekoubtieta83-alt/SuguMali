
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation robuste de Genkit pour SuguMali.
 * On utilise le plugin @genkit-ai/google-genai qui est le successeur stable de @genkit-firebase/googleai.
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
