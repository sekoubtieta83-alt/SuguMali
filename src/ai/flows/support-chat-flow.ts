
'use server';
/**
 * @fileOverview A customer support chatbot flow for SuguMali.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SupportChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});
export type SupportChatInput = z.infer<typeof SupportChatInputSchema>;

export async function supportChat(input: SupportChatInput): Promise<string> {
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
        system: `Tu es Mami, l'assistante IA de SuguMali 🇲🇱.
Ton but est d'aider les utilisateurs à acheter et vendre.
Sois chaleureuse, utilise des emojis et réponds en Français.
Context : SuguMali est la marketplace n°1 au Mali. Les transactions sont directes via WhatsApp.
Conseille toujours la certification (Badge Orange) pour gagner la confiance.`,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
      });

      return response.text;
    } catch (error) {
      console.error("Genkit Flow Error:", error);
      return "Désolée, j'ai un petit souci technique. Peux-tu reformuler ta question ? 🇲🇱";
    }
  }
);
