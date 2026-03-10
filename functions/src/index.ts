
import { onCall, HttpsError } from 'firebase/functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

// Initialisation de Firebase Admin si nécessaire
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 * Renforce la stabilité en interceptant les erreurs internes.
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  region: 'us-central1'
}, async (request) => {
  const { messages, mode } = request.data;
  
  if (!messages || !Array.isArray(messages)) {
    throw new HttpsError('invalid-argument', 'Le format des messages est incorrect.');
  }

  try {
    // Appel au flux Genkit
    const response = await mamiChatFlow({ messages, mode });
    return { response };
  } catch (error: any) {
    console.error('Erreur critique mamiChat Function:', error);
    // On renvoie un message propre au lieu de laisser Firebase lever une erreur "internal" opaque au client
    return { 
      response: "Mami fait une petite pause technique. Mes excuses pour ce contretemps, je reviens très vite !" 
    };
  }
});

/**
 * Vérification de l'état du backend.
 */
export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  };
});
