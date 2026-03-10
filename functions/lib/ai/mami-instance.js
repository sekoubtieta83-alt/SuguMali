"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
/**
 * Instance centrale Genkit pour SuguMali (Backend).
 * Utilise le plugin officiel recommandé.
 */
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, google_genai_1.googleAI)({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
        }),
    ],
    model: 'googleai/gemini-1.5-flash',
});
