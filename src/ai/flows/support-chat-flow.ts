'use server';
/**
 * @fileOverview Flux de chat pour l'assistante Mami sur SuguMali.
 * Gère la communication avec Gemini 1.5 Flash via Genkit.
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
 * Limite l'historique à 10 messages pour plus de stabilité.
 */
export async function supportChat(input: SupportChatInput): Promise<string> {
  const hasKey = !!process.env.GOOGLE_GENAI_API_KEY;
  
  // On ne garde que les 10 derniers messages pour éviter de saturer le modèle
  const recentMessages = input.messages.slice(-10);
  
  console.log("[MAMI] Requête de chat. Historique réduit à:", recentMessages.length, "messages.");

  if (!hasKey) {
    return "Désolée, je ne suis pas connectée au serveur (Clé API manquante). 🇲🇱";
  }

  try {
    const response = await ai.generate({
      system: "Tu es Mami, l'assistante de SuguMali. Aide les gens à acheter et vendre au Mali avec chaleur et courtoisie. Utilise des emojis.",
      messages: recentMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
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
      }
    });

    if (!response || !response.text) {
      return "Je n'ai pas pu générer de réponse. Peux-tu reformuler ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI] Erreur lors de la génération:", error.message);
    
    if (error.message?.includes('safety')) {
      return "Désolée, ce sujet est délicat et je ne peux pas en discuter. 🇲🇱";
    }

    return "Petit souci technique ! Réessaie dans un instant. 🇲🇱";
  }
}
