'use server';
/**
 * @fileOverview An AI flow to automatically moderate ads for SuguMali.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerateAnnonceInputSchema = z.object({
  title: z.string().describe('The title of the ad.'),
  description: z.string().describe('The description of the ad.'),
});
export type ModerateAnnonceInput = z.infer<typeof ModerateAnnonceInputSchema>;

const ModerateAnnonceOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether or not the ad is approved for publication.'),
  reason: z.string().optional().describe('The reason for rejection, if applicable, in French.'),
});
export type ModerateAnnonceOutput = z.infer<typeof ModerateAnnonceOutputSchema>;

const BANNED_KEYWORDS = [
  'western union', 'moneygram', 'ria', 'virement international',
  'contrefaçon', 'réplique', 'tramadol', 'cannabis', 'drogue',
  'stupéfiant', 'faux passeport', 'faux billet', 'argent facile',
  'gagner de l\'argent facile', 'investissement miracle',
  'travail à domicile sans expérience', 'don contre frais de port',
  'copie', 'faux', 'cbd', 'streaming', 'iptv'
];

export async function moderateAnnonce(input: ModerateAnnonceInput): Promise<ModerateAnnonceOutput> {
  const lowerTitle = input.title.toLowerCase();
  const lowerDesc = input.description.toLowerCase();

  const foundFlag = BANNED_KEYWORDS.find(keyword => 
    lowerTitle.includes(keyword) || lowerDesc.includes(keyword)
  );

  if (foundFlag) {
    return {
      isApproved: false,
      reason: `Contenu non autorisé détecté : "${foundFlag}" est interdit sur SuguMali.`,
    };
  }

  return moderateAnnonceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateAnnoncePrompt',
  input: { schema: ModerateAnnonceInputSchema },
  output: { schema: ModerateAnnonceOutputSchema },
  prompt: `Vous êtes Mami, la modératrice de SuguMali.
Analysez l'annonce :
Titre : {{{title}}}
Description : {{{description}}}

Refusez : drogues, arnaques financières, contrefaçons, contenu indécent ou prix irréels.
Répondez en Français.`,
});

const moderateAnnonceFlow = ai.defineFlow(
  {
    name: 'moderateAnnonceFlow',
    inputSchema: ModerateAnnonceInputSchema,
    outputSchema: ModerateAnnonceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
