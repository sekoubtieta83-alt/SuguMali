
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Fonction de santé avec réponse JSON correcte
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'online',
    message: 'SuguMali Functions are online!',
    timestamp: new Date().toISOString()
  });
});
