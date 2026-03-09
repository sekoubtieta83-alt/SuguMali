import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

// Initialisation de Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami utilisant Firebase Functions v2.
 * Gère les appels depuis le front-end avec Genkit.
 */
export const mamiChat = onCall({ cors: true }, async (request) => {
  try {
    const { messages } = request.data;
    
    if (!messages || !Array.isArray(messages)) {
      throw new HttpsError('invalid-argument', 'Le format des messages est incorrect.');
    }

    console.log(`Requête mamiChat reçue : ${messages.length} messages.`);

    // Appel au flux Genkit
    const response = await mamiChatFlow({ messages });
    
    return { response };
  } catch (error: any) {
    console.error('Erreur critique Mami Chat (Backend):', error);
    
    // On renvoie une erreur structurée pour éviter le crash "internal"
    throw new HttpsError('internal', error.message || 'Une erreur est survenue lors du traitement.');
  }
});

/**
 * Fonction de santé du backend.
 */
export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString()
  };
});
