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

      const modeContext = input.mode === 'vendre' 
        ? "L'utilisateur est en MODE VENTE. Aide-le à fixer ses prix, rédiger son annonce et donne-lui des conseils pour vendre vite au Mali." 
        : "L'utilisateur est en MODE ACHAT. Aide-le à trouver des produits. Si tu suggères des produits, utilise UNIQUEMENT le format JSON spécifié.";
      
      const response = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        system: `Tu es Mami, l'assistante officielle de SuguMali, experte en petites annonces en Afrique de l'Ouest.
        
        Tes directives :
        - Ton ton est chaleureux, direct et respectueux (utilise le FCFA pour les prix).
        - Réponds toujours en français. Max 150 mots par réponse.
        
        ${modeContext}
        
        - FORMAT PRODUITS (Obligatoire pour les suggestions en mode achat) :
          Insère exactement ce bloc dans ta réponse si tu proposes des articles :
          [PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "50 000 FCFA", "tag": "Bon plan", "deal": false}]}]
        
        Historique de conversation :
        {{#each messages}}
        {{role}}: {{{content}}}
        {{/each}}`,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
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
