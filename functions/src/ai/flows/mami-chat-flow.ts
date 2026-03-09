import { ai } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami.
 * Optimisé pour Genkit 1.x et Gemini 1.5 Flash.
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
      // Configuration de la génération avec le modèle Flash
      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: `Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme et les conseiller pour vendre plus vite ou acheter en toute sécurité. 
        
        Instructions clés :
        - Sois concise, amicale et professionnelle.
        - Réponds toujours en français.
        - Encourage l'utilisation de WhatsApp pour finaliser les ventes.
        - Ton ton est celui d'une assistante bienveillante et dynamique.`,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
      });

      if (!response.text) {
        throw new Error("L'IA n'a pas pu générer de texte.");
      }

      return response.text;
    } catch (error) {
      console.error('Erreur Genkit mamiChatFlow:', error);
      throw error;
    }
  }
);
