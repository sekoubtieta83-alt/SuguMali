import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Fonction de santé de base pour valider le déploiement
export const healthCheck = functions.https.onRequest((request, response) => {
  response.send("SuguMali Functions are online!");
});

// Exportation de la logique IA depuis le dossier local des fonctions
export { supportChat } from './ai/flows/support-chat-flows';
