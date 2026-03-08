
'use server';

/**
 * @fileOverview Flux de chat pour l'assistante Mami.
 * Utilise Genkit 1.x avec les derniers standards de sécurité et de performance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SupportChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});

export async function supportChat(input: z.infer<typeof SupportChatInputSchema>): Promise<string> {
  return supportChatFlow(input);
}

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: "Tu es Mami, l'assistante intelligente et chaleureuse de SuguMali au Mali 🇲🇱. Ton rôle est d'aider les utilisateurs maliens à naviguer sur la plateforme, les conseiller pour leurs achats et ventes, et répondre à leurs questions avec bienveillance. Sois concise, professionnelle et utilise parfois des expressions locales maliennes si approprié.",
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
      });

      return response.text || "Désolée, je rencontre une petite difficulté pour vous répondre. 🇲🇱";
    } catch (error) {
      console.error("Erreur Mami AI:", error);
      return "Désolée, je n'ai pas pu traiter votre demande pour le moment. Réessayez dans un instant.";
    }
  }
);
