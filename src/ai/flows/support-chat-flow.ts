
'use server';
/**
 * @fileOverview Flux de chat pour l'assistante Mami sur SuguMali.
 * 
 * - supportChat - Fonction gérant la communication avec l'IA.
 * - SupportChatInput - Schéma d'entrée des messages.
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
        model: 'googleai/gemini-1.5-flash',
        system: "Tu es Mami, l'assistante intelligente et chaleureuse de SuguMali au Mali 🇲🇱. Ton rôle est d'aider les utilisateurs maliens à naviguer sur la plateforme, les conseiller pour leurs achats et ventes, et répondre à leurs questions avec bienveillance. Sois concise et professionnelle.",
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
        config: {
          temperature: 0.7,
          maxOutputTokens: 600,
        }
      });

      return response.text || "Désolée, je rencontre une petite difficulté technique pour générer ma réponse. 🇲🇱";
    } catch (error: any) {
      console.error("[MAMI ERROR]", error);
      // On retourne l'erreur réelle pour diagnostic si besoin
      return `ERREUR TECHNIQUE MAMI : ${error.message || "Erreur de connexion"}. 🇲🇱`;
    }
  }
);
