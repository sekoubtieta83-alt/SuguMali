
'use server';
/**
 * Flux de chat pour l'assistante Mami sur SuguMali.
 * Gère la communication avec Gemini via Genkit 1.x.
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
  const recentMessages = input.messages.slice(-10);
  
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante chaleureuse de SuguMali au Mali 🇲🇱. Tu aides les utilisateurs maliens avec bienveillance et professionnalisme. Sois concise.",
      messages: recentMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      config: {
        temperature: 0.7,
        maxOutputTokens: 600,
      }
    });

    if (!response || !response.text) {
      return "Désolée, je rencontre une petite difficulté pour générer ma réponse. Peux-tu reformuler ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI ERROR]", error);
    // On retourne l'erreur réelle pour diagnostic comme demandé
    return `ERREUR TECHNIQUE MAMI : ${error.message || "Erreur de connexion"}. 🇲🇱`;
  }
}
