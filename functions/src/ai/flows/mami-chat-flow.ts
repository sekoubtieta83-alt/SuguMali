
export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
  sponsoredAnnonces?: Array<{
    id: string;
    titre: string;
    prix: string;
    categorie: string;
    localisation: string;
  }>;
}, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Clé API manquante');

  let msgs = [...input.messages];
  while (msgs.length > 0 && msgs[0].role === 'model') msgs.shift();
  msgs = msgs.reduce((acc: typeof msgs, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role) return acc;
    acc.push(msg);
    return acc;
  }, []);

  if (msgs.length === 0) return "Bonjour ! Je suis Mami. Comment puis-je vous aider ?";

  const ctx = input.mode === 'vendre'
    ? "L'utilisateur veut VENDRE. Conseille prix FCFA, rédaction annonce, photos, sécurité transaction."
    : "L'utilisateur veut ACHETER ou pose une question. Réponds complètement. Suggère articles avec prix FCFA si pertinent.";

  const sponsoredCtx = input.sponsoredAnnonces?.length
    ? `\nANNONCES SPONSORISÉES PRIORITAIRES :\n${input.sponsoredAnnonces.map(a =>
        `- ID:${a.id} | ${a.titre} | ${a.prix} | ${a.categorie} | ${a.localisation}`
      ).join('\n')}\nSi pertinentes, utilise leur ID dans le bloc PRODUCTS avec sponsored:true.`
    : '';

  const sys = `Tu es Mami, l'assistante intelligente de SuguMali — la plus grande communauté de commerce local au Mali.

RÈGLES ABSOLUES :
- Réponds TOUJOURS en français, avec chaleur et naturel
- Utilise uniquement les prix en FCFA
- Maximum 180 mots par réponse
- Tu connais le marché malien (Bamako, Sikasso, Mopti, Kayes, etc.)

CONTEXTE : ${ctx}${sponsoredCtx}

QUAND TU SUGGÈRES DES PRODUITS, termine OBLIGATOIREMENT par ce bloc JSON exact sur UNE SEULE LIGNE :
[PRODUCTS: {"items": [{"id": "firestore_id_ou_null", "emoji": "📱", "name": "Nom", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false, "sponsored": false}]}]

RÈGLES PRODUITS :
- Annonce sponsorisée disponible et pertinente → sponsored:true + vrai id Firestore
- Pas d'annonce sponsorisée → sponsored:false + id:null
- Les annonces sponsored s'affichent EN PREMIER avec badge doré
- deal:true = badge orange "Offre spéciale"
- Propose toujours 2 à 4 produits pertinents`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent?key=${apiKey}`,
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, pas de réponse.";
}
