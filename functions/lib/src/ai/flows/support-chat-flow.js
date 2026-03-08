"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportChat = supportChat;
/**
 * Flux de chat pour l'assistante Mami.
 * Gère la communication intelligente avec les utilisateurs via Genkit 1.x.
 */
const mami_instance_1 = require("@/ai/mami-instance");
const zod_1 = require("zod");
const MessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'model']),
    content: zod_1.z.string(),
});
const SupportChatInputSchema = zod_1.z.object({
    messages: zod_1.z.array(MessageSchema),
});
/**
 * Fonction principale de l'assistante Mami.
 * Utilise Genkit pour générer une réponse basée sur l'historique de conversation.
 */
async function supportChat(input) {
    try {
        const response = await mami_instance_1.ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: "Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme, les conseiller pour leurs achats et ventes, et répondre à leurs questions avec bienveillance. Sois concise, professionnelle et amicale. Tu réponds toujours en français.",
            messages: input.messages.map(m => ({
                role: m.role,
                content: [{ text: m.content }]
            })),
        });
        if (!response.text) {
            throw new Error("Aucune réponse générée par le modèle.");
        }
        return response.text;
    }
    catch (error) {
        console.error("Erreur Mami Support Chat:", error);
        return "Je suis désolée, j'ai une petite difficulté à me connecter à mes outils de réflexion. Pourriez-vous vérifier que ma connexion (clé API) est bien configurée ? Je reviens très vite pour vous aider !";
    }
}
//# sourceMappingURL=support-chat-flow.js.map