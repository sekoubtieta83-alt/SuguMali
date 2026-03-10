import { ai } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 * Construction du prompt en JS pur pour éviter les erreurs de parsing Handlebars.
 */
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

      const response = await ai.generate({
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

    } catch (error: any) {
      console.error('Erreur Mami Chat Flow:', error.message || error);
      throw error;
    }
  }
);
