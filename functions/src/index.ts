import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

admin.initializeApp();

/**
 * Fonction de santé du backend SuguMali.
 */
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'online',
    message: 'SuguMali Functions are online!',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint de chat pour Mami.
 */
export const mamiChat = functions.https.onCall(async (request) => {
  try {
    const { messages } = request.data;
    if (!messages || !Array.isArray(messages)) {
      throw new functions.https.HttpsError('invalid-argument', 'Messages requis.');
    }

    const response = await mamiChatFlow({ messages });
    return { response };
  } catch (error: any) {
    console.error('Erreur Mami Chat:', error);
    throw new functions.https.HttpsError('internal', 'Désolée, je rencontre une difficulté technique.');
  }
});
