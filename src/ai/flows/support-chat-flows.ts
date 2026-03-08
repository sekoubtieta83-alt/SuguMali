'use server';

import { ai } from '../genkit';
import { z } from 'zod';

// Schéma de validation des messages
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// Schéma d'entrée du flux
const InputSchema = z.object({
  messages: z.array(MessageSchema),
  systemPrompt: z.string().optional(),
});

// Schéma de sortie du flux
const OutputSchema = z.object({
  response: z.string(),
  usage: z.any().optional(),
});

// Définition du flux de chat support
export const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChat',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    try {
      console.log('🔵 supportChatFlow appelé avec:', input.messages.length, 'messages');
      
      // Configuration du modèle Gemini
      const model = ai.getModel('gemini-1.5-flash', {
        systemInstruction: input.systemPrompt || 
          "Vous êtes Mami, l'assistante virtuelle de SuguMali. " +
          "Vous êtes amicale, serviable et répondez toujours en français. " +
          "Vous aidez les utilisateurs avec leurs questions sur la plateforme.",
        temperature: 0.7,
        maxOutputTokens: 1024,
      });

      // Appel à l'API Gemini
      const response = await model.generate({
        messages: input.messages.map(msg => ({
          role: msg.role,
          content: [{ text: msg.content }],
        })),
      });

      console.log('🟢 Réponse reçue de Gemini');
      
      return {
        response: response.text,
        usage: response.usage,
      };
      
    } catch (error) {
      console.error('🔴 Erreur dans supportChatFlow:', error);
      
      // Message d'erreur友好
      return {
        response: "Désolée, je rencontre une difficulté technique. " +
                 "Pouvez-vous réessayer dans quelques instants ?",
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
);

// Fonction utilitaire pour tester le flux
export async function testSupportChat() {
  const result = await supportChatFlow({
    messages: [
      { role: 'user', content: 'Bonjour Mami !' }
    ]
  });
  console.log('Test result:', result);
  return result;
}