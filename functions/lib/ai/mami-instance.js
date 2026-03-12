"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ai = void 0;
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
exports.ai = (0, genkit_1.genkit)({
    plugins: [
        (0, googleai_1.googleAI)({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
            apiVersion: 'v1',
        }),
    ],
    model: 'googleai/gemini-2.0-flash',
});
