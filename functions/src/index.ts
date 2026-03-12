import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

// Définition du secret pour la clé API Google AI
const GOOGLE_GENAI_API_KEY = defineSecret('GOOGLE_GENAI_API_KEY');

// Initialisation de l'admin Firebase (idempotent)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Point d'entrée HTTPS pour le chat avec Mami.
 * Utilise les Secrets Firebase pour protéger la clé API.
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
    const responseText = await mamiChatFlow({ messages, mode });
    
    // On renvoie un objet structuré pour le frontend
    return { 
      success: true, 
      text: responseText,
      response: responseText // Pour la compatibilité avec certains clients
    };
  } catch (error: any) {
    console.error('Erreur mamiChat:', error.message || error);
    
    // On renvoie un message gracieux au lieu de faire planter l'interface
    return { 
      success: false, 
      text: "Mami fait une petite pause technique. Je reviens tout de suite !",
      response: "Mami fait une petite pause technique. Je reviens tout de suite !",
      error: error.message 
    };
  }
});

/**
 * Vérification simple de l'état du service.
 */
export const healthCheck = onCall(() => {
  return {
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Mami AI Assistant'
  };
});
