
import { ai, googleAIPlugin } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 * Utilise une construction de prompt en JS pur pour éviter les erreurs de parsing.
 */
export const mamiChatFlow = ai.defineFlow(
  {
    name: 'mamiChatFlow',
    inputSchema: z.object({
      messages: z.array(MessageSchema),
      mode: z.enum(['acheter', 'vendre']).optional().default('acheter'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      if (!input.messages || input.messages.length === 0) {
        return "Bonjour ! Je suis Mami. Comment puis-je vous aider sur SuguMali aujourd'hui ?";
      }

      // Construction du contexte en JS pur
      const modeContext = input.mode === 'vendre' 
        ? "L'utilisateur est en MODE VENTE. Aide-le à fixer ses prix, rédiger son annonce et donne-lui des conseils pour vendre vite au Mali (en FCFA)." 
        : "L'utilisateur est en MODE ACHAT. Aide-le à trouver des produits. Si tu suggères des produits, utilise UNIQUEMENT le format JSON spécifié.";
      
      const systemInstruction = `Tu es Mami, l'assistante officielle de SuguMali, experte en petites annonces en Afrique de l'Ouest.
      
      Tes directives :
      - Ton ton est chaleureux, direct et respectueux.
      - Utilise le FCFA pour tous les prix.
      - Réponds toujours en français. Max 150 mots par réponse.
      
      CONTEXTE ACTUEL : ${modeContext}
      
      FORMAT PRODUITS (Obligatoire pour les suggestions en mode achat) :
      Si tu proposes des articles, insère exactement ce bloc JSON à la fin de ta réponse :
      [PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "50 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

      const response = await ai.generate({
        model: googleAIPlugin.model('gemini-2.0-flash'),
        system: systemInstruction,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
        config: {
          temperature: 0.7,
        }
      });

      if (!response || !response.text) {
        throw new Error("Le modèle Gemini n'a pas renvoyé de texte.");
      }

      return response.text;
    } catch (error: any) {
      console.error('Erreur Genkit mamiChatFlow:', error);
      return "Désolée, je rencontre une petite difficulté technique pour accéder à mes connaissances. Veuillez réessayer dans un instant !";
    }
  }
);
