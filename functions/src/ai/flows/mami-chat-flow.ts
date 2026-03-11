import { ai } from '../mami-instance';
import { z } from 'zod';

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

    let cleanMessages = [...input.messages];
    while (cleanMessages.length > 0 && cleanMessages[0].role === 'model') {
      cleanMessages.shift();
    }
    cleanMessages = cleanMessages.reduce((acc: any[], msg) => {
      const last = acc[acc.length - 1];
      if (last && last.role === msg.role) return acc;
      acc.push(msg);
      return acc;
    }, []);

    if (cleanMessages.length === 0 || cleanMessages[0].role !== 'user') {
      return "Bonjour ! Je suis Mami 🌸. Que puis-je faire pour vous ?";
    }

    const modeContext = input.mode === 'vendre'
      ? "L'utilisateur souhaite VENDRE. Conseillez prix FCFA, rédaction, sécurité."
      : "L'utilisateur souhaite ACHETER. Suggérez articles avec prix FCFA.";

    const systemInstruction = `Tu es Mami, assistante de SuguMali 🇲🇱.
- Français uniquement. FCFA uniquement. Max 150 mots.
Contexte : ${modeContext}
Si tu suggères des articles, termine par :
[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      system: systemInstruction,
      messages: cleanMessages.map(m => ({
        role: m.role as any,
        content: [{ text: m.content }],
      })),
      config: { temperature: 0.8 },
    });

    if (!response?.text) throw new Error("Pas de réponse Gemini.");
    return response.text;
  }
);