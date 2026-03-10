import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

// Définition du secret pour la clé API
const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY');

// Initialisation de l'admin Firebase
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Endpoint de chat pour Mami (Backend).
 * L'utilisation de 'secrets' est OBLIGATOIRE pour éviter l'erreur "internal".
 */
export const mamiChat = onCall({ 
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  region: 'us-central1',
  secrets: [GOOGLE_GENAI_API_KEY] 
}, async (request) => {
  try {
    const { messages, mode } = request.data;
    
    if (!messages || !Array.isArray(messages)) {
      throw new HttpsError('invalid-argument', 'Le format des messages est invalide.');
    }

    // Appel au flux Genkit
    const response = await mamiChatFlow({ messages, mode });
    
    return { success: true, response };
  } catch (error: any) {
    console.error('mamiChat error:', error);
    // On renvoie un message gracieux au lieu de faire planter le front
    return { 
      success: false,
      response: "Mami fait une petite pause technique. Je reviens tout de suite !",
      error: error.message
    };
  }
});

/**
 * Vérification de l'état du service.
 */
export const healthCheck = onCall((request) => {
  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    engine: 'gemini-1.5-flash'
  };
});