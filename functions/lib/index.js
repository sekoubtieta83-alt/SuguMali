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
const admin = __importStar(require("firebase-admin"));
const mami_chat_flow_1 = require("./ai/flows/mami-chat-flow");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Endpoint de chat pour Mami (Backend).
 */
exports.mamiChat = (0, https_1.onCall)({
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60
}, async (request) => {
    try {
        const { messages } = request.data;
        if (!messages || !Array.isArray(messages)) {
            throw new https_1.HttpsError('invalid-argument', 'Le format des messages est incorrect.');
        }
        // Appel au flux Genkit
        const response = await (0, mami_chat_flow_1.mamiChatFlow)({ messages });
        return { response };
    }
    catch (error) {
        console.error('Erreur critique Mami Chat (Backend):', error);
        // On renvoie une erreur descriptive plutôt qu'un code internal générique si possible
        throw new https_1.HttpsError('internal', error.message || 'Désolée, je rencontre une difficulté technique temporaire.');
    }
});
exports.healthCheck = (0, https_1.onCall)((request) => {
    return {
        status: 'online',
        timestamp: new Date().toISOString()
    };
});
//# sourceMappingURL=index.js.map