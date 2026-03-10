import { ai } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 * Intègre les modes Achat et Vente avec formatage de produits.
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
        return "Bonjour ! Je suis Mami. Comment puis-je vous aider sur SuguMali ?";
      }

      const modePrefix = input.mode === 'vendre' ? '[MODE VENTE] ' : '[MODE ACHAT] ';
      
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', // Utilisation de Gemini 2.0
        system: `Tu es Mami, assistante petites annonces chaleureuse en Afrique de l'Ouest (FCFA).
        
        - MODE ACHAT : suggère 2-4 produits fictifs ou réels selon le budget avec ce format JSON EXACT dans ta réponse (ne pas oublier les crochets) :
          [PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "50 000 FCFA", "tag": "Bon plan", "deal": false}]}]
        
        - MODE VENTE : conseille sur les prix, la rédaction d'annonce percutante, et les mots-clés pour vendre vite au Mali.
        
        Ton ton est amical, direct et respectueux. Réponds toujours en français. Max 150 mots hors bloc de produits.`,
        messages: input.messages.map((m, index) => ({
          role: m.role,
          content: [{ text: (index === input.messages.length - 1 && m.role === 'user') ? modePrefix + m.content : m.content }]
        })),
      });

      if (!response || !response.text) {
        throw new Error("Le modèle n'a pas renvoyé de texte.");
      }

      return response.text;
    } catch (error: any) {
      console.error('Erreur Genkit mamiChatFlow:', error);
      return "Désolée, je rencontre une petite difficulté technique. Veuillez réessayer dans quelques instants.";
    }
  }
);
