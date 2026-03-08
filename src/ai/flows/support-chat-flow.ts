'use server';

/**
 * Flux de chat pour l'assistante Mami.
 * Gère la communication intelligente avec les utilisateurs via Genkit 1.x.
 */

import { ai } from '@/ai/mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SupportChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});

/**
 * Fonction principale de l'assistante Mami.
 */
export async function supportChat(input: z.infer<typeof SupportChatInputSchema>): Promise<string> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante intelligente et chaleureuse de SuguMali au Mali 🇲🇱. Ton rôle est d'aider les utilisateurs maliens à naviguer sur la plateforme, les conseiller pour leurs achats et ventes, et répondre à leurs questions avec bienveillance. Sois concise, professionnelle et utilise parfois des expressions locales maliennes si approprié.",
      messages: input.messages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
    });

    if (!response.text) {
      throw new Error("Aucune réponse générée par le modèle.");
    }

    return response.text;
  } catch (error) {
    console.error("Erreur Mami Support Chat:", error);
    return "I ni sogoma ! Désolée, je rencontre une petite difficulté technique. Réessayez dans un instant. Je suis toujours là pour vous aider ! 🇲🇱";
  }
}
