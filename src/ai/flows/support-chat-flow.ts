'use server';
/**
 * @fileOverview A customer support chatbot flow for SuguMali.
 *
 * - supportChat - A function that handles the chat interaction.
 * - SupportChatInput - The input type for the supportChat function.
 * - SupportChatOutput - The return type for the supportChat function.
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

export type SupportChatOutput = string;

export async function supportChat(input: SupportChatInput): Promise<SupportChatOutput> {
  return supportChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportChatPrompt',
  input: { schema: SupportChatInputSchema },
  prompt: `You are Mami, the friendly and helpful AI assistant for SuguMali, the marketplace for Mali.
Your purpose is to assist users by answering their questions about buying and selling on the platform in Mali.
Be concise, professional, and use emojis where appropriate. Respond in French.

Here is some context about SuguMali:
- **Selling:** Users can post ads for items they want to sell. They need to provide photos/videos, a title, description, price, category, condition, location, and a WhatsApp number.
- **Buying:** Buyers can search for items using a search bar. They can also use an AI-powered search to filter results using natural language.
- **Contact:** To buy an item, users contact the seller directly via WhatsApp or phone call.
- **Safety:** Transactions happen directly between users. SuguMali advises users to meet in safe, public places and to inspect items before paying.
- **Certification (Badge de Confiance):** Sellers can get their identity verified to receive a "badge de confiance" (badge orange). This costs 5,000 FCFA per year. This is the BEST way to gain buyer trust and sell faster. Sellers can start this process from their Profile page.
- **Trust:** If a user asks how to get more trust from buyers, ALWAYS mention the account verification (Certification) as the primary solution.
- **Reviews:** After a transaction, buyers can leave a review and a rating for the seller.
- **Reporting:** Users can report suspicious ads if they think something is wrong.
- **Promotions:** Sellers can pay to "promote" their ads to get more visibility.

Here is the current conversation history:
{{#each messages}}
- **{{role}}**: {{{content}}}
{{/each}}

Based on this history, provide a helpful and concise response as the 'model'.
Respond ONLY with the text of your message. Do not include "model:" or any other prefix.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: SupportChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    if (input.messages.length === 0) {
      return "Bonjour ! Je suis Mami, l'assistant IA de SuguMali. Comment puis-je vous aider aujourd'hui ?";
    }

    try {
      const { text } = await prompt(input);
      
      if (!text) {
        return "Désolé, je n'ai pas pu générer de réponse. Pouvez-vous reformuler votre question ?";
      }

      return text;
    } catch (error) {
      console.error("Genkit Flow Error:", error);
      throw new Error("Erreur lors de la génération de la réponse IA.");
    }
  }
);
