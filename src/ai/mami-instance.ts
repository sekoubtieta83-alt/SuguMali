import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialisation de l'instance Genkit pour SuguMali.
 * Le fichier est nommé 'mami-instance' pour éviter les conflits de noms avec le package 'genkit'.
 */
export const ai = genkit({
  plugins: [
    googleAI(), // Utilise automatiquement les clés d'API de l'environnement
  ],
});
