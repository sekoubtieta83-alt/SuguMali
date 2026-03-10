
import { ai, googleAIPlugin } from '../mami-instance';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

/**
 * Flux de conversation avec Mami optimisé pour SuguMali.
 * Utilise la construction de prompt en JS pur pour éviter les erreurs 'internal'.
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
        return "Bonjour ! Je suis Mami. Comment puis-je vous aider sur SuguMali aujourd'hui ?";
      }

      // ✅ FIX : Construction dynamique du prompt en JS pur (Pas de Handlebars ici)
      const modeContext = input.mode === 'vendre' 
        ? "L'utilisateur souhaite VENDRE. Conseillez-le sur les prix en FCFA, la rédaction de l'annonce et la sécurité." 
        : "L'utilisateur souhaite ACHETER. Aidez-le à trouver des articles et proposez des prix en FCFA.";
      
      const systemInstruction = `Tu es Mami, l'assistante officielle de SuguMali 🇲🇱.
      Directives :
      - Ton amical, professionnel et direct.
      - Langue : Français uniquement.
      - Monnaie : FCFA uniquement.
      - Longueur : Maximum 150 mots.
      
      Contexte actuel : ${modeContext}
      
      IMPORTANT (Format Produits) :
      Si vous suggérez des articles, terminez TOUJOURS votre réponse par ce bloc JSON exact :
      [PRODUCTS: {"items": [{"emoji": "📱", "name": "Exemple Produit", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

      const response = await ai.generate({
        model: googleAIPlugin.model('gemini-1.5-flash'),
        system: systemInstruction,
        messages: input.messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        })),
        config: {
          temperature: 0.8,
        }
      });

      if (!response || !response.text) {
        throw new Error("Gemini n'a pas renvoyé de réponse valide.");
      }

      return response.text;
    } catch (error: any) {
      console.error('Erreur Mami Chat Flow:', error);
      return "Désolée, je rencontre une petite difficulté technique. Je reviens vers vous très vite !";
    }
  }
);
