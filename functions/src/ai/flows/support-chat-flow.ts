import { ai } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const SupportChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});

/**
 * Fonction principale de l'assistante Mami pour les Cloud Functions.
 */
export async function supportChat(input: z.infer<typeof SupportChatInputSchema>): Promise<string> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: "Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme et les conseiller. Sois concise, professionnelle et amicale. Tu réponds toujours en français.",
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
    console.error("Erreur Mami Support Chat (Backend):", error);
    return "Je suis désolée, je rencontre une petite difficulté technique. Veuillez réessayer plus tard.";
  }
}
