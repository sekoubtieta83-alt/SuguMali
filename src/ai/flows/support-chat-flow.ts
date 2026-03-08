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
 * Affiche l'erreur réelle pour le débogage.
 */
export async function supportChat(input: SupportChatInput): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const recentMessages = input.messages.slice(-10);
  
  console.log("[MAMI] Requête de chat reçue. Messages:", recentMessages.length);

  if (!apiKey) {
    return "ERREUR : Clé API manquante (Vérifiez vos variables d'environnement Vercel). 🇲🇱";
  }

  try {
    const response = await ai.generate({
      // Utilisation du modèle flash stable
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante de SuguMali au Mali. Aide les gens à acheter et vendre avec chaleur. Utilise des emojis.",
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
      return "ERREUR : Le modèle n'a renvoyé aucun texte. 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI] Erreur critique détaillée:", error);
    
    // Affichage de l'erreur réelle pour le débogage utilisateur
    return `ERREUR IA (${error.name}) : ${error.message} 🇲🇱`;
  }
}
