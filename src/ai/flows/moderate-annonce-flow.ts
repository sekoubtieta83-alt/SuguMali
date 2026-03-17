'use server';
/**
 * @fileOverview Flux de modération automatique des annonces par Mami.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerateAnnonceInputSchema = z.object({
  titre: z.string(),
  description: z.string(),
  prix: z.string(),
});

const ModerateAnnonceOutputSchema = z.object({
  approved: z.boolean().describe('Indique si l\'annonce respecte les règles de sécurité.'),
  reason: z.string().describe('La raison du rejet ou un court message de validation.'),
  confidenceScore: z.number().describe('Niveau de confiance de l\'IA (0 à 1).'),
});

export async function moderateAnnonce(input: z.infer<typeof ModerateAnnonceInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    system: `Tu es Mami, l'experte en sécurité et modération de SuguMali. 
    Ta mission est d'analyser les annonces avant publication pour protéger la communauté.
    
    CRITÈRES DE SÉCURITÉ :
    1. ARNAQUES : Détecte les offres trop belles pour être vraies ou les langages suspects.
    2. PRIX IRRÉALISTES : Un iPhone à 1000 FCFA ou une voiture à 50 000 FCFA doit être rejeté.
    3. PRODUITS INTERDITS : Pas de drogues, armes, médicaments sur ordonnance ou services illégaux.
    4. CONTENU : Pas d'insultes, de contenu sexuel ou de haine.
    5. COHÉRENCE : Le titre et la description doivent correspondre.
    
    Réponds toujours de manière ferme mais polie en français.`,
    prompt: `Analyse cette annonce pour SuguMali :
    Titre : ${input.titre}
    Description : ${input.description}
    Prix : ${input.prix}`,
    output: { schema: ModerateAnnonceOutputSchema },
  });

  return output!;
}
