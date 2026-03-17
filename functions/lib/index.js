"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = exports.mamiChat = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const mami_chat_flow_1 = require("./ai/flows/mami-chat-flow");
const analyze_image_flow_1 = require("./ai/flows/analyze-image-flow");
const GOOGLE_GENAI_API_KEY = (0, params_1.defineSecret)("GOOGLE_GENAI_API_KEY");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
// ─── Constantes de rate limiting ───────────────────────────────────────────
const MAX_MESSAGES_PAR_MINUTE = 10; // max 10 messages / minute / utilisateur
const MAX_MESSAGES_PAR_JOUR = 100; // max 100 messages / jour / utilisateur
exports.mamiChat = (0, https_1.onCall)({
    cors: true,
    region: 'europe-west1',
    enforceAppCheck: true, // 🔒 App Check activé — seule ton app peut appeler cette fonction
    secrets: [GOOGLE_GENAI_API_KEY],
    timeoutSeconds: 30,
    memory: '512MiB',
}, async (request) => {
    // ── 1. Authentification obligatoire ────────────────────────────────────────
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Tu dois être connecté pour utiliser Mami.');
    }
    const userId = request.auth.uid;
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10); // "2026-03-16"
    // ── 2. Rate Limiting — par minute et par jour ───────────────────────────────
    const rateLimitRef = db.collection('rateLimits').doc(userId);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(rateLimitRef);
        const data = snap.data() || {};
        // Compteur par minute
        const minuteCount = (now - (data.lastMinuteReset || 0) < 60000)
            ? (data.minuteCount || 0)
            : 0;
        // Compteur par jour
        const dailyCount = (data.lastDay === today)
            ? (data.dailyCount || 0)
            : 0;
        if (minuteCount >= MAX_MESSAGES_PAR_MINUTE) {
            throw new https_1.HttpsError('resource-exhausted', 'Trop de messages envoyés. Attends 1 minute avant de réessayer.');
        }
        if (dailyCount >= MAX_MESSAGES_PAR_JOUR) {
            throw new https_1.HttpsError('resource-exhausted', 'Tu as atteint la limite de messages pour aujourd\'hui. Reviens demain !');
        }
        tx.set(rateLimitRef, {
            minuteCount: minuteCount + 1,
            lastMinuteReset: minuteCount === 0 ? now : (data.lastMinuteReset || now),
            dailyCount: dailyCount + 1,
            lastDay: today,
        }, { merge: true });
    });
    // ── 3. Validation des données entrantes ────────────────────────────────────
    const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Messages invalides.');
    }
    if (messages.length > 20) {
        throw new https_1.HttpsError('invalid-argument', 'Trop de messages dans la conversation (max 20).');
    }
    if (mode && !['acheter', 'vendre'].includes(mode)) {
        throw new https_1.HttpsError('invalid-argument', 'Mode invalide.');
    }
    // ── 4. Appel Gemini ────────────────────────────────────────────────────────
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    const response = await (0, mami_chat_flow_1.mamiChatFlow)({ messages, mode, sponsoredAnnonces, allAnnonces }, apiKey);
    return { text: response };
});
// ─── analyzeImage — Analyse d'image par Mami ────────────────────────────────
exports.analyzeImage = (0, https_1.onCall)({
    cors: true,
    region: 'europe-west1',
    enforceAppCheck: false,
    secrets: [GOOGLE_GENAI_API_KEY],
    timeoutSeconds: 60,
    memory: '512MiB',
}, async (request) => {
    // Auth obligatoire
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Tu dois être connecté.');
    }
    const { imageBase64 } = request.data;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Image invalide.');
    }
    // Limite taille image (max 4MB en base64)
    if (imageBase64.length > 5500000) {
        throw new https_1.HttpsError('invalid-argument', 'Image trop lourde. Max 4MB.');
    }
    const apiKey = GOOGLE_GENAI_API_KEY.value();
    const result = await (0, analyze_image_flow_1.analyzeImageFlow)({ imageBase64, apiKey });
    return result;
});
