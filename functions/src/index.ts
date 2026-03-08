import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

admin.initializeApp();

/**
 * Fonction de santé du backend SuguMali.
 */
export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    message: 'SuguMali Functions are online!',
    timestamp: new Date().toISOString()
  };
});

/**
 * Endpoint de chat pour Mami utilisant Firebase Functions v2.
 */
export const mamiChat = onCall(async (request) => {
  try {
    const { messages } = request.data;
    
    if (!messages || !Array.isArray(messages)) {
      throw new HttpsError('invalid-argument', 'Le format des messages est incorrect.');
    }

    console.log(`Mami reçoit ${messages.length} messages.`);

    const response = await mamiChatFlow({ messages });
    
    if (!response) {
      throw new Error("L'IA n'a pas retourné de réponse.");
    }

    return { response };
  } catch (error: any) {
    console.error('Erreur Mami Chat (Backend):', error);
    
    // On propage une erreur explicite pour le client
    throw new HttpsError('internal', error.message || 'Désolée, je rencontre une difficulté technique.');
  }
});
