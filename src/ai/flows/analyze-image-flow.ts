'use server';
/**
 * @fileOverview Flux d'analyse d'images par IA pour SuguMali.
 * 
 * - analyzeImage - Fonction pour analyser la sécurité et le contenu d'une image.
 * - AnalyzeImageInput - Type d'entrée (URI de données base64).
 * - AnalyzeImageOutput - Type de sortie (sécurité, description, catégorie).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Une photo du produit, sous forme d'URI de données incluant le type MIME et le codage Base64. Format attendu : 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  isSafe: z.boolean().describe('Indique si l\'image est sûre pour la plateforme (pas de contenu interdit).'),
  description: z.string().describe('Une brève description de l\'objet principal dans l\'image.'),
  detectedCategory: z.string().describe('La catégorie probable du produit détecté.'),
  confidence: z.number().describe('Niveau de confiance de l\'analyse (0 à 1).'),
  reason: z.string().optional().describe('Raison du rejet si l\'image est jugée inappropriée.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return analyzeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImagePrompt',
  input: { schema: AnalyzeImageInputSchema },
  output: { schema: AnalyzeImageOutputSchema },
  prompt: `Tu es Mami, l'experte en modération visuelle de SuguMali.
  Analyse cette image pour vérifier si elle respecte les règles de la communauté.
  
  CRITÈRES DE SÉCURITÉ :
  1. CONTENU INTERDIT : Pas de nudité, violence, drogues, armes ou symboles de haine.
  2. QUALITÉ : L'image doit montrer un produit réel, pas un écran noir ou du texte uniquement.
  3. IDENTIFICATION : Décris ce que tu vois et suggère une catégorie.

  Image à analyser : {{media url=photoDataUri}}`,
});

const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImageFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
