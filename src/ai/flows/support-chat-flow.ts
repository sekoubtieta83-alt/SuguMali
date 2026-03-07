
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
  const hasKey = !!process.env.GOOGLE_GENAI_API_KEY;
  console.log("[MAMI] Appel reçu. Messages:", input.messages.length, "| Clé API configurée:", hasKey);
  
  if (!hasKey) {
    console.error("[MAMI] ERREUR : La variable d'environnement GOOGLE_GENAI_API_KEY est introuvable au moment de l'exécution.");
    return "Désolée, je ne suis pas encore tout à fait prête (Clé API non détectée). 🇲🇱";
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
      console.warn("[MAMI] Le modèle a renvoyé une réponse vide.");
      return "Je n'ai pas pu formuler de réponse cette fois. Peux-tu réessayer ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    // Log extrêmement détaillé pour le débogage Vercel
    console.error("[MAMI] Erreur de génération détectée :", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: error.status || "N/A",
      details: error.details || "Aucun détail JSON"
    });

    if (error.message?.toLowerCase().includes('safety')) {
      return "Désolée, je ne peux pas traiter cette demande pour des raisons de sécurité. 🇲🇱";
    }

    if (error.message?.toLowerCase().includes('quota')) {
      return "Désolée, je suis un peu surchargée en ce moment. Réessayez dans une minute ! 🇲🇱";
    }

    return `Désolée, j'ai rencontré un problème technique (${error.name}). Peux-tu reformuler ? 🇲🇱`;
  }
}
