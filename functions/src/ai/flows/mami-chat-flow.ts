export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
  sponsoredAnnonces?: Array<{ id: string; titre: string; prix: string; categorie: string; localisation: string }>;
  allAnnonces?: Array<{ id: string; titre: string; prix: string; categorie: string; localisation: string }>;
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

  const isFirstMessage = msgs.filter(m => m.role === 'user').length === 1;

  const ctx = input.mode === 'vendre'
    ? "L'utilisateur veut VENDRE sur SuguMali. Conseille-le sur le prix en FCFA, la rédaction de l'annonce, les photos et la sécurité de la transaction."
    : "L'utilisateur veut ACHETER. Base-toi UNIQUEMENT sur les annonces disponibles sur SuguMali listées ci-dessous.";

  const sponsoredCtx = input.sponsoredAnnonces?.length
    ? `\n⭐ ANNONCES SPONSORISÉES (afficher EN PREMIER si pertinentes) :\n${
        input.sponsoredAnnonces.map(a =>
          `  - ID:${a.id} | ${a.titre} | ${a.prix} | ${a.categorie} | ${a.localisation}`
        ).join('\n')
      }`
    : '';

  const allCtx = input.allAnnonces?.length
    ? `\nTOUTES LES ANNONCES DISPONIBLES SUR SUGUMALI :\n${
        input.allAnnonces.slice(0, 20).map(a =>
          `  - ID:${a.id} | ${a.titre} | ${a.prix} | ${a.categorie} | ${a.localisation}`
        ).join('\n')
      }\n\nIMPORTANT : Suggère UNIQUEMENT des produits de cette liste. Si aucun ne correspond, dis-le honnêtement sans inventer.`
    : "\nAucune annonce disponible sur SuguMali pour l'instant. Invite l'utilisateur à revenir bientôt ou à publier la sienne.";

  const greetingRule = isFirstMessage
    ? ''
    : '\nNe commence JAMAIS par une salutation (Bonjour, Salut, Bonsoir, etc.) — va directement au sujet.';

  const sys = `Tu es Mami , l'assistante de SuguMali — la plus grande communauté de commerce local au Mali.

RÈGLES ABSOLUES :
- Réponds TOUJOURS en français naturel et chaleureux
- Utilise uniquement les prix en FCFA
- Maximum 120 mots par réponse
- Écris toujours "SuguMali" en entier — JAMAIS "ML", "SG", "sm" ou toute abréviation
- Tu parles UNIQUEMENT de ce qui se passe sur SuguMali. Ne mentionne JAMAIS de sites tiers ou de solutions extérieures au Mali.${greetingRule}

CONSEILS DE VENTE (Obligatoires si l'utilisateur veut vendre ou demande comment réussir) :
- Suggère toujours la CERTIFICATION (Badge orange de confiance pour 5 000 FCFA/an) pour rassurer les clients.
- Suggère la PROMOTION d'annonce (Sponsorisation) pour apparaître en haut de liste et dans l'onglet Promos.
- Rappelle que SuguMali est la plateforme la plus rapide au Mali pour trouver un acheteur sérieux.

CONTEXTE : ${ctx}
${sponsoredCtx}
${allCtx}

QUAND TU SUGGÈRES DES PRODUITS, tu DOIS OBLIGATOIREMENT terminer ta réponse par ce bloc JSON sur UNE SEULE LIGNE EXACTEMENT comme ceci :
[PRODUCTS: {"items": [{"id": "ID_1", "emoji": "📱", "name": "Titre 1", "price": "Prix 1", "tag": "Bon plan", "deal": false, "sponsored": false}, {"id": "ID_2", "emoji": "📱", "name": "Titre 2", "price": "Prix 2", "tag": "Bon plan", "deal": false, "sponsored": false}]}]

IMPORTANT : Le bloc PRODUCTS est automatiquement converti en cartes cliquables par l'application. Ne jamais expliquer les images ou les liens.

RÈGLES PRODUITS :
- Utilise UNIQUEMENT les IDs Firestore exacts des annonces listées ci-dessus
- sponsored:true → badge doré ⭐, mis EN PREMIER dans la liste
- deal:true → badge orange "Offre spéciale"
- Si aucune annonce pertinente → n'affiche PAS de bloc PRODUCTS.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
          candidateCount: 1,
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, je n'ai pas pu générer de réponse.";
}