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
exports.healthCheck = exports.mamiChat = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const mami_chat_flow_1 = require("./ai/flows/mami-chat-flow");
// Définition du secret pour la clé API Google AI
const GOOGLE_GENAI_API_KEY = (0, params_1.defineSecret)('GOOGLE_GENAI_API_KEY');
// Initialisation de l'admin Firebase (idempotent)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Point d'entrée HTTPS pour le chat avec Mami.
 * Utilise les Secrets Firebase pour protéger la clé API et éviter l'erreur "internal".
 */
exports.mamiChat = (0, https_1.onCall)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
    region: 'us-central1',
    secrets: [GOOGLE_GENAI_API_KEY]
}, async (request) => {
    try {
        const { messages, mode } = request.data;
        if (!messages || !Array.isArray(messages)) {
            throw new https_1.HttpsError('invalid-argument', 'Le format des messages est invalide.');
        }
        // Appel au flux mamiChatFlow robuste
        const responseText = await (0, mami_chat_flow_1.mamiChatFlow)({ messages, mode });
        // On renvoie un objet structuré pour le frontend
        return {
            success: true,
            text: responseText,
            response: responseText // Pour la compatibilité ascendante
        };
    }
    catch (error) {
        console.error('Erreur critique mamiChat:', error.message || error);
        // On renvoie un message gracieux au lieu de faire planter l'interface
        return {
            success: false,
            text: "Mami fait une petite pause technique pour mieux vous servir. Je reviens dans un instant !",
            response: "Mami fait une petite pause technique pour mieux vous servir. Je reviens dans un instant !",
            error: error.message
        };
    }
});
/**
 * Vérification simple de l'état du service.
 */
exports.healthCheck = (0, https_1.onCall)(() => {
    return {
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Mami AI Assistant',
        engine: 'Gemini 1.5 Flash'
    };
});
