import { ai } from '../mami-instance';
import { z } from 'zod';

/**
 * @fileOverview Flux de chat pour l'assistante Mami de SuguMali.
 * Gère la validation de l'historique et la génération de réponses via Gemini.
 */

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const mamiChatFlow = ai.defineFlow(
  {
    name: 'mamiChatFlow',
    inputSchema: z.object({
      messages: z.array(MessageSchema),
      mode: z.enum(['acheter', 'vendre']).optional().default('acheter'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    if (!input.messages || input.messages.length === 0) {
      return "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider sur SuguMali ?";
    }

    // Nettoyage de l'historique : Gemini exige que le premier message soit 'user'
    let cleanMessages = [...input.messages];
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'model') {
      cleanMessages.shift();
    }

    // Assurer l'alternance stricte des rôles (user -> model -> user)
    cleanMessages = cleanMessages.reduce((acc: typeof cleanMessages, msg) => {
      const last = acc[acc.length - 1];
      if (last && last.role === msg.role) return acc;
      acc.push(msg);
      return acc;
    }, []);

    if (cleanMessages.length === 0 || cleanMessages[0].role !== 'user') {
      return "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider aujourd'hui ?";
    }

    const modeContext = input.mode === 'vendre'
      ? "L'utilisateur souhaite VENDRE. Donne des conseils précis sur la fixation du prix en FCFA, la rédaction d'une annonce attrayante, l'importance de belles photos et la sécurité lors de la transaction physique."
      : "L'utilisateur souhaite ACHETER ou pose une question générale. Aide-le à trouver les meilleurs articles et suggère des produits avec leurs prix en FCFA.";

    const systemInstruction = `Tu es Mami, l'assistante officielle et bienveillante de SuguMali 🇲🇱.
Ton but est d'aider les Maliens à faire de bonnes affaires en toute sécurité.

Directives :
- Sois amicale, utilise un ton chaleureux ("Mami") mais reste professionnelle.
- Réponds TOUJOURS en français.
- Utilise TOUJOURS la monnaie FCFA.
- Réponds COMPLÈTEMENT à la question, sans te couper.
- Maximum 200 mots par réponse.

Contexte actuel : ${modeContext}

Si tu suggères des articles ou des bons plans, termine TOUJOURS ton message par ce bloc JSON exact pour l'affichage :
[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: systemInstruction,
      messages: cleanMessages.map(m => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
      config: { 
        temperature: 0.7,
        maxOutputTokens: 1024 
      },
    });

    if (!response?.text) {
      throw new Error("Désolée, Gemini n'a pas pu générer de réponse.");
    }

    return response.text;
  }
);
