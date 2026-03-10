
import { onCall, HttpsError } from 'firebase/functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 * Région us-central1 pour correspondre au client.
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  region: 'us-central1'
}, async (request) => {
  const { messages, mode } = request.data;
  
  if (!messages || !Array.isArray(messages)) {
    throw new HttpsError('invalid-argument', 'Format de messages invalide.');
  }

  try {
    const response = await mamiChatFlow({ messages, mode });
    return { response };
  } catch (error: any) {
    console.error('Erreur mamiChat:', error);
    return { 
      response: "Mami fait une petite pause technique. Mes excuses, je reviens tout de suite !" 
    };
  }
});

export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'gemini-2.0-flash'
  };
});
