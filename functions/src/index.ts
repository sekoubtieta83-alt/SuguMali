import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';
import { analyzeImageFlow } from './ai/flows/analyze-image-flow';

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

// ─── Constantes de rate limiting ───────────────────────────────────────────
const MAX_MESSAGES_PAR_MINUTE = 10;   // max 10 messages / minute / utilisateur
const MAX_MESSAGES_PAR_JOUR   = 100;  // max 100 messages / jour / utilisateur

export const mamiChat = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: true,   // 🔒 App Check activé
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Tu dois être connecté pour utiliser Mami.');
  }

  const userId = request.auth.uid;
  const now    = Date.now();
  const today  = new Date().toISOString().slice(0, 10);

  const rateLimitRef = db.collection('rateLimits').doc(userId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(rateLimitRef);
    const data = snap.data() || {};

    const minuteCount  = (now - (data.lastMinuteReset || 0) < 60_000) ? (data.minuteCount || 0) : 0;
    const dailyCount = (data.lastDay === today) ? (data.dailyCount || 0) : 0;

    if (minuteCount >= MAX_MESSAGES_PAR_MINUTE) {
      throw new HttpsError('resource-exhausted', 'Trop de messages. Attends 1 minute.');
    }

    if (dailyCount >= MAX_MESSAGES_PAR_JOUR) {
      throw new HttpsError('resource-exhausted', 'Limite quotidienne atteinte. Reviens demain !');
    }

    tx.set(rateLimitRef, {
      minuteCount:     minuteCount + 1,
      lastMinuteReset: minuteCount === 0 ? now : (data.lastMinuteReset || now),
      dailyCount:      dailyCount + 1,
      lastDay:         today,
    }, { merge: true });
  });

  const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;

  try {
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    const response = await mamiChatFlow({ messages, mode, sponsoredAnnonces, allAnnonces }, apiKey);
    return { text: response };
  } catch (error: any) {
    console.error("Mami Chat Error:", error);
    throw new HttpsError('internal', 'Mami a eu un petit problème technique.');
  }
});

// ─── analyzeImage — Analyse d'image par Mami ────────────────────────────────
export const analyzeImage = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false,
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 60,
  memory: '512MiB',
}, async (request) => {

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Tu dois être connecté.');
  }

  const { imageBase64 } = request.data;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'Image manquante ou invalide.');
  }

  if (imageBase64.length > 6_000_000) {
    throw new HttpsError('invalid-argument', 'Image trop lourde pour l\'analyse.');
  }

  try {
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    if (!apiKey) {
      throw new Error("Clé API Gemini non configurée dans le backend.");
    }
    const result = await analyzeImageFlow({ imageBase64, apiKey });
    return result;
  } catch (error: any) {
    console.error('AnalyzeImage Backend Error:', error);
    // On transforme l'erreur interne en HttpsError pour éviter le message "INTERNAL" générique sur le client
    throw new HttpsError('internal', error.message || 'Erreur lors de l\'analyse de l\'image.');
  }
});