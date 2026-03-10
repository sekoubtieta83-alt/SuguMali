import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60
}, async (request) => {
  try {
    const { messages, mode } = request.data;
    
    if (!messages || !Array.isArray(messages)) {
      throw new HttpsError('invalid-argument', 'Le format des messages est incorrect.');
    }

    // Appel au flux Genkit avec le mode
    const response = await mamiChatFlow({ messages, mode });
    
    return { response };
  } catch (error: any) {
    console.error('Erreur critique Mami Chat (Backend):', error);
    throw new HttpsError('internal', error.message || 'Erreur interne du serveur.');
  }
});

export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString()
  };
});
