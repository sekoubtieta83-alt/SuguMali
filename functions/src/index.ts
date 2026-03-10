
import { onCall, HttpsError } from 'firebase/functions/v2/https';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 * Configuration robuste avec CORS et région spécifiée.
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  region: 'us-central1'
}, async (request) => {
  const { messages, mode } = request.data;
  
  if (!messages || !Array.isArray(messages)) {
    throw new HttpsError('invalid-argument', 'Le format des messages est invalide.');
  }

  try {
    // Appel au flux stabilisé
    const response = await mamiChatFlow({ messages, mode });
    return { response };
  } catch (error: any) {
    console.error('Erreur critique mamiChat Function:', error);
    // On renvoie un message gracieux pour éviter le crash 'internal' côté client
    return { 
      response: "Mami fait une petite pause technique. Je reviens tout de suite !" 
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
    engine: 'gemini-1.5-flash'
  };
});
