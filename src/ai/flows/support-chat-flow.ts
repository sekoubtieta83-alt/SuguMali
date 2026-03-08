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
 * Utilise l'identifiant de modèle stable googleai/gemini-1.5-flash.
 */
export async function supportChat(input: SupportChatInput): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const recentMessages = input.messages.slice(-10);
  
  if (!apiKey) {
    return "ERREUR : Clé API manquante dans l'environnement. 🇲🇱";
  }

  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante chaleureuse de SuguMali au Mali 🇲🇱. Tu aides les utilisateurs à acheter et vendre en utilisant des emojis et un ton accueillant.",
      messages: recentMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      config: {
        temperature: 0.7,
        maxOutputTokens: 800,
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }
    });

    if (!response || !response.text) {
      return "Désolée, je n'ai pas pu formuler de réponse. Réessaie dans un instant. 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI] Erreur de génération IA:", error);
    return `ERREUR TECHNIQUE MAMI : ${error.message || "Erreur de connexion"}. 🇲🇱`;
  }
}
