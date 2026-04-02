import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';
import { analyzeImageFlow } from './ai/flows/analyze-image-flow';

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const MAX_MESSAGES_PAR_MINUTE = 10;
const MAX_MESSAGES_PAR_JOUR   = 100;

// --- CONFIGURATION E-MAIL ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'votre-email@gmail.com',
    pass: 'votre-mot-de-passe-application',
  },
});

async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: '"SuguMali Sécurité" <noreply@sugumali.com>',
    to: email,
    subject: `${otp} est votre code de récupération SuguMali`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF8C00; text-align: center;">Récupération de compte SuguMali</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification à usage unique :</p>
        <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #666;">Ce code expirera dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 10px; color: #aaa; text-align: center;">© SuguMali — Marketplace n°1 au Mali</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// --- CLOUD FUNCTIONS ---

/**
 * Vérifie si un utilisateur existe déjà avec ce numéro de téléphone.
 * Utilisé pour la connexion sécurisée sans exposer les permissions de listing Firestore.
 */
export const checkUserByPhone = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  const { phoneNumber } = request.data;
  if (!phoneNumber) throw new HttpsError('invalid-argument', 'Numéro requis.');
  
  try {
    const snap = await db.collection('users')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();
    
    return { exists: !snap.empty };
  } catch (error) {
    console.error("Erreur checkUserByPhone:", error);
    throw new HttpsError('internal', 'Impossible de vérifier le numéro.');
  }
});

export const mamiChat = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false,
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {
  const userId = request.auth?.uid || null;
  const now    = Date.now();
  const today  = new Date().toISOString().slice(0, 10);

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

// --- GESTION DES MOTS DE PASSE (OTP) ---

export const requestPasswordResetOTP = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  const { email } = request.data;
  if (!email) throw new HttpsError('invalid-argument', 'Email requis.');

  try {
    await admin.auth().getUserByEmail(email);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await db.collection('password_resets').doc(email).set({
      otp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await sendOTPEmail(email, otp);
    } catch (mailError) {
      console.error("Erreur envoi e-mail:", mailError);
    }
    
    return { success: true };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Aucun compte associé à cet e-mail.');
    }
    throw new HttpsError('internal', 'Erreur lors de la génération du code.');
  }
});

export const verifyOTPAndResetPassword = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  const { email, otp, newPassword } = request.data;
  if (!email || !otp || !newPassword) {
    throw new HttpsError('invalid-argument', 'Tous les champs sont requis.');
  }

  const resetRef = db.collection('password_resets').doc(email);
  const resetDoc = await resetRef.get();

  if (!resetDoc.exists) {
    throw new HttpsError('not-found', 'Aucune demande de réinitialisation trouvée.');
  }

  const data = resetDoc.data();
  if (data?.otp !== otp) {
    throw new HttpsError('permission-denied', 'Code OTP incorrect.');
  }

  if (Date.now() > (data?.expiresAt || 0)) {
    throw new HttpsError('deadline-exceeded', 'Le code a expiré.');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
    await resetRef.delete();
    return { success: true };
  } catch (error: any) {
    throw new HttpsError('internal', 'Erreur lors de la mise à jour du mot de passe.');
  }
});

// --- NOTIFICATIONS AUTOMATIQUES ---

// Trigger quand une annonce est rejetée (création ou mise à jour)
export const onAnnonceModerated = onDocumentUpdated({
  document: 'annonces/{annonceId}',
  region: 'europe-west1'
}, async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();

  // Si le statut passe à 'rejected'
  if (newValue?.status === 'rejected' && previousValue?.status !== 'rejected') {
    const userId = newValue.vendeurId;
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: 'Annonce rejetée ⚠️',
          body: `Votre annonce "${newValue.titre}" a été rejetée. Raison : ${newValue.moderationReason || 'Non respect des règles'}`,
        },
        tokens: tokens,
      };
      try {
        await admin.messaging().sendEachForMulticast(message);
      } catch (e) {
        console.error('Erreur envoi notification rejet:', e);
      }
    }
  }
});

// Trigger à la création pour les annonces directement rejetées par l'IA
export const onAnnonceCreated = onDocumentCreated({
  document: 'annonces/{annonceId}',
  region: 'europe-west1'
}, async (event) => {
  const data = event.data?.data();

  if (data?.status === 'rejected') {
    const userId = data.vendeurId;
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: 'Annonce refusée ⚠️',
          body: `Mami n'a pas pu valider votre annonce "${data.titre}". Raison : ${data.moderationReason || 'Non conforme'}`,
        },
        tokens: tokens,
      };
      try {
        await admin.messaging().sendEachForMulticast(message);
      } catch (e) {
        console.error('Erreur envoi notification création rejet:', e);
      }
    }
  }
});

// 1. Notification quand une promotion est approuvée
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

// 2. Notification quand la certification (badge orange) est approuvée
export const onCertificationApproved = onDocumentUpdated({
  document: 'users/{userId}',
  region: 'europe-west1'
}, async (event) => {
  const newValue = event.data?.after.data();
  const previousValue = event.data?.before.data();

  // Si isVerified passe de false à true
  if (newValue?.isVerified === true && previousValue?.isVerified !== true) {
    const tokens = newValue?.fcmTokens || [];

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: 'Félicitations ! 🍊',
          body: 'Votre compte est désormais certifié SuguMali. Votre badge orange est visible par tous.',
        },
        tokens: tokens,
      };
      try {
        await admin.messaging().sendEachForMulticast(message);
        console.log(`Notification certification envoyée à ${event.params.userId}`);
      } catch (e) {
        console.error('Erreur envoi notification certification:', e);
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
