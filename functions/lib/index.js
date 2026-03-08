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
exports.mamiChatDynamic = exports.mamiChat = exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Fonction de santé avec réponse JSON correcte
exports.healthCheck = functions.https.onRequest((request, response) => {
    response.json({
        status: 'online',
        message: 'SuguMali Functions are online!',
        timestamp: new Date().toISOString()
    });
});
// Option 1: Importer directement depuis le dossier local (recommandé)
const support_chat_flows_1 = require("./ai/flows/support-chat-flows");
exports.mamiChat = functions.https.onCall(async (data, context) => {
    try {
        const { message } = data;
        const result = await (0, support_chat_flows_1.supportChatFlow)(message);
        return {
            success: true,
            response: result.response || "Mami vous écoute..."
        };
    }
    catch (error) {
        console.error('Erreur Mami:', error);
        return {
            success: false,
            error: "Désolée, je rencontre une difficulté technique."
        };
    }
});
// Option 2: Alternative avec import dynamique pour éviter les erreurs de type
exports.mamiChatDynamic = functions.https.onCall(async (data, context) => {
    try {
        // Import dynamique pour éviter les erreurs de type
        const { supportChatFlow } = await Promise.resolve().then(() => __importStar(require('./ai/flows/support-chat-flows')));
        return await supportChatFlow(data.message);
    }
    catch (error) {
        return { error: "Erreur technique" };
    }
});
//# sourceMappingURL=index.js.map