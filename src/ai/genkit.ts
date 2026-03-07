
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Diagnostic au chargement du module pour vérifier la présence de la clé.
 * Ce log apparaîtra dans les logs de build et d'exécution de Vercel.
 */
console.log("[GENKIT] Initialisation du module. Clé GOOGLE_GENAI_API_KEY présente :", !!process.env.GOOGLE_GENAI_API_KEY);

/**
 * Initialisation de Genkit avec le plugin Google AI.
 * Le plugin utilise explicitement la variable d'environnement GOOGLE_GENAI_API_KEY.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
