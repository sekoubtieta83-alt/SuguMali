import { onCall, HttpsError } from 'firebase/functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 * Utilise HttpsError de manière contrôlée pour un meilleur débogage.
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60
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
    console.error('Erreur d\'exécution mamiChat Function:', error);
    // On évite de lancer une exception brute pour ne pas avoir d'erreur "internal" opaque
    return { 
      response: "Je suis temporairement indisponible. Mes excuses pour ce contretemps technique." 
    };
  }
});

export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString()
  };
});
