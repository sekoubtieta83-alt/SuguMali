
import { ai, googleAIPlugin } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 * Évite les erreurs 'internal' en utilisant une construction de prompt en JS pur.
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

      // Construction dynamique du contexte système en JS pur
      const modeInstruction = input.mode === 'vendre' 
        ? "L'utilisateur veut VENDRE. Conseille-le sur les prix en FCFA, la rédaction de son annonce et la sécurité." 
        : "L'utilisateur veut ACHETER. Aide-le à trouver des articles. Propose des prix en FCFA.";
      
      const systemPrompt = `Tu es Mami, l'assistante officielle de SuguMali 🇲🇱.
      Directives :
      - Ton amical et direct.
      - Toujours en français.
      - Prix en FCFA uniquement.
      - Max 150 mots.
      
      ${modeInstruction}
      
      FORMAT PRODUITS (Obligatoire pour les suggestions d'articles) :
      Si tu suggères des produits, insère ce bloc JSON exact à la fin de ta réponse :
      [PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "50 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

      const response = await ai.generate({
        model: googleAIPlugin.model('gemini-1.5-flash'),
        system: systemPrompt,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
        config: {
          temperature: 0.7,
        }
      });

      if (!response || !response.text) {
        throw new Error("Gemini n'a pas renvoyé de réponse.");
      }

      return response.text;
    } catch (error: any) {
      console.error('Erreur Mami Flow:', error);
      return "Désolée, je rencontre une petite difficulté technique. Mami revient très vite !";
    }
  }
);
