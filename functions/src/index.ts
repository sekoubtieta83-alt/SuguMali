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
  enforceAppCheck: true,   // 🔒 App Check activé — seule ton app peut appeler cette fonction
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {

  // ── 1. Authentification obligatoire ────────────────────────────────────────
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Tu dois être connecté pour utiliser Mami.'
    );
  }

  const userId = request.auth.uid;
  const now    = Date.now();
  const today  = new Date().toISOString().slice(0, 10); // "2026-03-16"

  // ── 2. Rate Limiting — par minute et par jour ───────────────────────────────
  const rateLimitRef = db.collection('rateLimits').doc(userId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(rateLimitRef);
    const data = snap.data() || {};

    // Compteur par minute
    const minuteCount  = (now - (data.lastMinuteReset || 0) < 60_000)
      ? (data.minuteCount || 0)
      : 0;

    // Compteur par jour
    const dailyCount = (data.lastDay === today)
      ? (data.dailyCount || 0)
      : 0;

    if (minuteCount >= MAX_MESSAGES_PAR_MINUTE) {
      throw new HttpsError(
        'resource-exhausted',
        'Trop de messages envoyés. Attends 1 minute avant de réessayer.'
      );
    }

    if (dailyCount >= MAX_MESSAGES_PAR_JOUR) {
      throw new HttpsError(
        'resource-exhausted',
        'Tu as atteint la limite de messages pour aujourd\'hui. Reviens demain !'
      );
    }

    tx.set(rateLimitRef, {
      minuteCount:     minuteCount + 1,
      lastMinuteReset: minuteCount === 0 ? now : (data.lastMinuteReset || now),
      dailyCount:      dailyCount + 1,
      lastDay:         today,
    }, { merge: true });
  });

  // ── 3. Validation des données entrantes ────────────────────────────────────
  const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpsError('invalid-argument', 'Messages invalides.');
  }

  if (messages.length > 20) {
    throw new HttpsError('invalid-argument', 'Trop de messages dans la conversation (max 20).');
  }

  if (mode && !['acheter', 'vendre'].includes(mode)) {
    throw new HttpsError('invalid-argument', 'Mode invalide.');
  }

  // ── 4. Appel Gemini ────────────────────────────────────────────────────────
  const apiKey = GOOGLE_GENAI_API_KEY.value();

  const response = await mamiChatFlow(
    { messages, mode, sponsoredAnnonces, allAnnonces },
    apiKey
  );

  return { text: response };
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

  // Auth obligatoire
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Tu dois être connecté.');
  }

  const { imageBase64 } = request.data;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'Image invalide.');
  }

  // Limite taille image (max 4MB en base64)
  if (imageBase64.length > 5_500_000) {
    throw new HttpsError('invalid-argument', 'Image trop lourde. Max 4MB.');
  }

  const apiKey = GOOGLE_GENAI_API_KEY.value();

  const result = await analyzeImageFlow({ imageBase64, apiKey });

  return result;
});