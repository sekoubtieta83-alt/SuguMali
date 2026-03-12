/**
 * @fileOverview Flux de discussion avec l'assistante Mami.
 * 
 * - mamiChatFlow : Gère la logique de conversation avec Gemini.
 */

export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
}, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Clé API manquante');

  let msgs = [...input.messages];
  // Nettoyage de l'historique pour Gemini
  while (msgs.length > 0 && msgs[0].role === 'model') msgs.shift();
  msgs = msgs.reduce((acc: typeof msgs, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role) return acc;
    acc.push(msg);
    return acc;
  }, []);

  if (msgs.length === 0) return "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider ?";

  const ctx = input.mode === 'vendre'
    ? "Utilisateur veut VENDRE. Conseille prix FCFA, rédaction annonce, photos, sécurité transaction."
    : "Utilisateur veut ACHETER ou pose une question générale. Réponds complètement. Suggère articles avec prix FCFA si pertinent.";

  const sys = `Tu es Mami, assistante SuguMali 🇲🇱. Réponds toujours en français, complètement. Utilise FCFA. Max 200 mots.\n${ctx}\nSi tu suggères des articles, termine par :\n[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          candidateCount: 1,
          thinkingConfig: { thinkingLevel: 'low' },
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API Error:', errText);
    throw new Error(`Erreur Gemini: ${res.statusText}`);
  }

  const data = await res.json();
  console.log('Finish reason:', data.candidates?.[0]?.finishReason);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, pas de réponse.";
}
