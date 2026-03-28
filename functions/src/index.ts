import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';
import { analyzeImageFlow } from './ai/flows/analyze-image-flow';

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const MAX_MESSAGES_PAR_MINUTE = 10;
const MAX_MESSAGES_PAR_JOUR   = 100;

// --- CLOUD FUNCTIONS ---

export const mamiChat = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false, // ✅ CORRIGÉ : était true, bloquait toutes les requêtes
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {

  // ✅ CORRIGÉ : auth optionnelle — Mami répond à tous, connectés ou non
  const userId = request.auth?.uid || null;
  const now    = Date.now();
  const today  = new Date().toISOString().slice(0, 10);

  // ✅ Rate limit uniquement pour les utilisateurs connectés
  if (userId) {
    const rateLimitRef = db.collection('rateLimits').doc(userId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateLimitRef);
      const data = snap.data() || {};
      const minuteCount = (now - (data.lastMinuteReset || 0) < 60_000) ? (data.minuteCount || 0) : 0;
      const dailyCount  = (data.lastDay === today) ? (data.dailyCount || 0) : 0;
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
  }

  const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;
  try {
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    const response = await mamiChatFlow({ messages, mode, sponsoredAnnonces, allAnnonces }, apiKey);
    return { text: response };
  } catch (error) {
    console.error("Mami Chat Error:", error);
    throw new HttpsError('internal', 'Mami a eu un petit probleme technique.');
  }
});

export const analyzeImage = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false,
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 60,
  memory: '512MiB',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Tu dois etre connecte.');
  }
  const { imageBase64 } = request.data;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'Image manquante ou invalide.');
  }
  if (imageBase64.length > 6_000_000) {
    throw new HttpsError('invalid-argument', 'Image trop lourde.');
  }
  try {
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    if (!apiKey) throw new Error("Cle API Gemini non configuree.");
    const result = await analyzeImageFlow({ imageBase64, apiKey });
    return result;
  } catch (error) {
    console.error('AnalyzeImage Backend Error:', error);
    throw new HttpsError('internal', (error as Error).message || 'Erreur analyse image.');
  }
});

export const moderateAnnonce = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false,
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Tu dois etre connecte.');
  }
  const { titre, description, prix } = request.data;
  if (!titre || !description) {
    throw new HttpsError('invalid-argument', 'Titre et description sont requis.');
  }
  try {
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    if (!apiKey) throw new Error("Cle API Gemini non configuree.");
    const { moderateAnnonce: moderateFlow } = await import('./ai/flows/moderate-annonce-flow');
    const result = await moderateFlow({ titre, description, prix }, apiKey);
    return result;
  } catch (error) {
    console.error('ModerateAnnonce Backend Error:', error);
    throw new HttpsError('internal', (error as Error).message || 'Erreur lors de la moderation.');
  }
});

// --- NOTIFICATIONS DE PROMOTION ---

export const onPromotionApproved = onDocumentUpdated({
  document: 'promotion_requests/{requestId}',
  region: 'europe-west1'
}, async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();

  if (newValue?.status === 'approved' && previousValue?.status !== 'approved') {
    const userId = newValue.userId;
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: 'Annonce Boostée ! 🚀',
          body: `Votre annonce "${newValue.annonceTitle}" est maintenant en haut de liste pour ${newValue.durationDays} jours.`,
        },
        tokens: tokens,
      };
      try {
        await admin.messaging().sendEachForMulticast(message);
        console.log(`Notification d'approbation envoyée à ${userId}`);
      } catch (e) {
        console.error('Erreur envoi notification approbation:', e);
      }
    }
  }
});

export const checkExpiredPromotions = onSchedule({
  schedule: '0 9 * * *',
  region: 'europe-west1'
}, async (event) => {
  const now = admin.firestore.Timestamp.now();
  
  const expiredAds = await db.collection('annonces')
    .where('isPromoted', '==', true)
    .where('promotionExpiresAt', '<=', now)
    .get();

  console.log(`Traitement de ${expiredAds.size} promotions expirées...`);

  for (const doc of expiredAds.docs) {
    const adData = doc.data();
    const userId = adData.vendeurId;
    
    await doc.ref.update({ 
      isPromoted: false,
      promotionExpiresAt: null 
    });

    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: 'Promotion terminée 🔔',
          body: `Le boost pour votre annonce "${adData.titre || 'Sans titre'}" vient de se terminer. Renouvelez-le pour rester visible !`,
        },
        tokens: tokens,
      };
      try {
        await admin.messaging().sendEachForMulticast(message);
      } catch (e) {
        console.error(`Erreur envoi notification expiration pour ${userId}:`, e);
      }
    }
  }
});