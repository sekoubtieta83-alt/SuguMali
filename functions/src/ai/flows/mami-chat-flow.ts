export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
}): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error('Clé API manquante');

  let msgs = [...input.messages];
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

  const sys = `Tu es Mami, assistante SuguMali 🇲🇱. Réponds toujours en français, complètement, sans te couper. Utilise FCFA. Max 200 mots.\n${ctx}\nSi tu suggères des articles, termine par :\n[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, pas de réponse.";
}
