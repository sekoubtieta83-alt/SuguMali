"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportChat = supportChat;
const mami_instance_1 = require("../mami-instance");
const zod_1 = require("zod");
const MessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'model']),
    content: zod_1.z.string(),
});
const SupportChatInputSchema = zod_1.z.object({
    messages: zod_1.z.array(MessageSchema),
});
/**
 * Fonction principale de l'assistante Mami pour les Cloud Functions.
 */
async function supportChat(input) {
    try {
        const response = await mami_instance_1.ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: "Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme et les conseiller. Sois concise, professionnelle et amicale. Tu réponds toujours en français.",
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
        console.error("Erreur Mami Support Chat (Backend):", error);
        return "Je suis désolée, je rencontre une petite difficulté technique. Veuillez réessayer plus tard.";
    }
}
//# sourceMappingURL=support-chat-flow.js.map