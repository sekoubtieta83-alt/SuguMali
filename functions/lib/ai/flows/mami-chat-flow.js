"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mamiChatFlow = void 0;
const mami_instance_1 = require("../mami-instance");
const zod_1 = require("zod");
const MessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'model']),
    content: zod_1.z.string(),
});
/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 */
exports.mamiChatFlow = mami_instance_1.ai.defineFlow({
    name: 'mamiChatFlow',
    inputSchema: zod_1.z.object({
        messages: zod_1.z.array(MessageSchema),
    }),
    outputSchema: zod_1.z.string(),
}, async (input) => {
    try {
        if (!input.messages || input.messages.length === 0) {
            return "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
        }
        const response = await mami_instance_1.ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: `Tu es Mami, l'assistante virtuelle de SuguMali. Ton rôle est d'aider les utilisateurs à naviguer sur la plateforme. 
        
        Conseils pour les utilisateurs :
        - Vendeurs : suggère-leur de prendre de belles photos et de bien décrire l'état de l'article.
        - Acheteurs : conseille-leur de toujours passer par WhatsApp pour finaliser les détails et de se donner rendez-vous dans des lieux publics pour la remise en main propre.
        
        Ton ton est amical, serviable et direct. Réponds toujours en français. Ne mentionne jamais de pays ou de drapeaux spécifiques.`,
            messages: input.messages.map(m => ({
                role: m.role,
                content: [{ text: m.content }]
            })),
        });
        if (!response || !response.text) {
            throw new Error("Le modèle n'a pas renvoyé de texte.");
        }
        return response.text;
    }
    catch (error) {
        console.error('Erreur Genkit mamiChatFlow:', error);
        // Retourne un message d'erreur gracieux au lieu de faire planter la fonction
        return "Je suis désolée, je rencontre une petite difficulté pour traiter votre demande. Pourriez-vous reformuler ?";
    }
});
//# sourceMappingURL=mami-chat-flow.js.map