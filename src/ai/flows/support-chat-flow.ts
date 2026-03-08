'use server';
/**
 * Flux de chat pour l'assistante Mami sur SuguMali.
 * Gère la communication avec Gemini 1.5 Flash via Genkit 1.x.
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

/**
 * Appelle l'IA Mami pour générer une réponse.
 * Utilise l'identifiant de modèle standard compatible avec le plugin Google AI.
 */
export async function supportChat(input: SupportChatInput): Promise<string> {
  const recentMessages = input.messages.slice(-10); // Historique optimisé
  
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      // Utilisation de la propriété 'system' conformément à Genkit 1.x
      system: "Tu es Mami, l'assistante chaleureuse de SuguMali au Mali 🇲🇱. Tu aides les utilisateurs avec bienveillance. Sois concise et professionnelle.",
      messages: recentMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }
    });

    if (!response || !response.text) {
      return "Désolée, je rencontre une petite difficulté pour générer ma réponse. Peux-tu reformuler ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI ERROR]", error);
    // Affichage de l'erreur réelle pour le diagnostic comme demandé
    return `ERREUR TECHNIQUE MAMI : ${error.message || "Erreur de connexion"}. 🇲🇱`;
  }
}
