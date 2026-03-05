
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

/**
 * Fonction de santé de base pour valider le déploiement de SuguMali.
 */
export const healthCheck = functions.https.onRequest((request, response) => {
  response.send("SuguMali Functions are online!");
});
