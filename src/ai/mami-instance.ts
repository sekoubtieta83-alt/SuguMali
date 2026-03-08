import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Instance centrale Genkit pour SuguMali.
 * Utilise la clé d'API spécifiée pour garantir le service.
 */
const apiKey = 'AIzaSyBbiHohK-AtBiXT9JkLkybC1WKRe2UMmCA';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
});
