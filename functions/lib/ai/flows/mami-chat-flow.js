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
 * Construction du prompt en JS pur pour éviter les erreurs de parsing Handlebars.
 */
exports.mamiChatFlow = mami_instance_1.ai.defineFlow({
    name: 'mamiChatFlow',
    inputSchema: zod_1.z.object({
        messages: zod_1.z.array(MessageSchema),
        mode: zod_1.z.enum(['acheter', 'vendre']).optional().default('acheter'),
    }),
    outputSchema: zod_1.z.string(),
}, async (input) => {
    try {
        if (!input.messages || input.messages.length === 0) {
            return "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider sur SuguMali ?";
        }
        const modeContext = input.mode === 'vendre'
            ? "L'utilisateur souhaite VENDRE. Conseillez-le sur les prix en FCFA, la rédaction et la sécurité."
            : "L'utilisateur souhaite ACHETER. Aidez-le à trouver des articles avec des prix en FCFA.";
        const systemInstruction = `Tu es Mami, l'assistante officielle de SuguMali 🇲🇱.
Directives :
- Ton amical, professionnel et direct.
- Langue : Français uniquement.
- Monnaie : FCFA uniquement.
- Maximum 150 mots.

Contexte actuel : ${modeContext}

IMPORTANT (Format Produits) :
Si tu suggères des articles, termine TOUJOURS ta réponse par ce bloc JSON exact :
[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom Produit", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;
        const response = await mami_instance_1.ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemInstruction,
            messages: input.messages.map(m => ({
                role: m.role,
                content: [{ text: m.content }],
            })),
            config: {
                temperature: 0.8,
            },
        });
        if (!response?.text) {
            throw new Error("Gemini n'a pas renvoyé de réponse valide.");
        }
        return response.text;
    }
    catch (error) {
        console.error('Erreur Mami Chat Flow:', error.message || error);
        throw error;
    }
});
