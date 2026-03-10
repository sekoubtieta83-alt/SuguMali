"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const genkit_1 = require("genkit");
const google_genai_1 = require("@genkit-ai/google-genai");
/**
 * Instance centrale Genkit pour SuguMali (Backend).
 * Utilise la clé API fournie : AIzaSyBynstf2xTUpFkPSFBwlZ1DpBRFJnXuOCA
 */
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, google_genai_1.googleAI)({
            apiKey: 'AIzaSyBynstf2xTUpFkPSFBwlZ1DpBRFJnXuOCA',
        }),
    ],
});
//# sourceMappingURL=mami-instance.js.map