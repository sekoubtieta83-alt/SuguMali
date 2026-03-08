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
    // Utilisation de la syntaxe simplifiée pour Genkit 1.x
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante chaleureuse de SuguMali au Mali 🇲🇱. Tu aides les utilisateurs maliens avec bienveillance et professionnalisme. Sois concise.",
      messages: recentMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    if (!response || !response.text) {
      return "Désolée, je rencontre une petite difficulté pour générer ma réponse. Peux-tu reformuler ? 🇲🇱";
    }

    return response.text;
  } catch (error: any) {
    console.error("[MAMI ERROR]", error);
    // Affichage de l'erreur réelle pour le diagnostic
    return `ERREUR TECHNIQUE MAMI : ${error.message || "Erreur de connexion"}. 🇲🇱`;
  }
}
