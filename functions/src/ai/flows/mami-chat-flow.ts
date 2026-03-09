
import { ai } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 */
export const mamiChatFlow = ai.defineFlow(
  {
    name: 'mamiChatFlow',
    inputSchema: z.object({
      messages: z.array(MessageSchema),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      if (!input.messages || input.messages.length === 0) {
        return "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
      }

      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: `Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme. 
        
        Conseils pour les utilisateurs :
        - Vendeurs : suggère-leur de prendre de belles photos et de bien décrire l'état de l'article.
        - Acheteurs : conseille-leur de toujours passer par WhatsApp pour finaliser les détails et de se donner rendez-vous dans des lieux publics pour la remise en main propre.
        
        Ton ton est amical, serviable et direct. Réponds toujours en français. Ne mentionne jamais de pays ou de drapeaux spécifiques.`,
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
      // Retourne un message d'erreur gracieux au lieu de faire planter la fonction
      return "Je suis désolée, je rencontre une petite difficulté pour traiter votre demande. Pourriez-vous reformuler ?";
    }
  }
);
