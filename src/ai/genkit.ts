
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de Genkit avec le plugin Google AI.
 * Le plugin utilise automatiquement la variable d'environnement GOOGLE_GENAI_API_KEY.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
