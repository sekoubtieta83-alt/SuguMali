
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

/**
 * Action serveur pour appeler l'assistant Mami.
 * Inclut une gestion d'erreur détaillée pour les logs Vercel.
 */
export async function supportChat(input: SupportChatInput): Promise<string> {
  console.log("[MAMI] Appel du flux de support avec", input.messages.length, "messages.");
  
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error("[MAMI] ERREUR CRITIQUE : La variable GOOGLE_GENAI_API_KEY est manquante.");
    return "Désolée, mon système n'est pas configuré correctement (Clé API manquante). 🇲🇱";
  }

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
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    if (!response || !response.text) {
      console.warn("[MAMI] La réponse du modèle est vide.");
      return "Je n'ai pas pu formuler de réponse. Peux-tu réessayer ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    // Log détaillé pour Vercel Logs
    console.error("[MAMI] Erreur lors de la génération de réponse :", {
      message: error.message,
      stack: error.stack,
      details: error.details || "Aucun détail supplémentaire",
    });

    if (error.message?.includes('safety')) {
      return "Désolée, je ne peux pas répondre à cette question pour des raisons de sécurité. 🇲🇱";
    }

    return "Désolée, j'ai un petit souci technique passager. Peux-tu reformuler ta question ? 🇲🇱";
  }
}
