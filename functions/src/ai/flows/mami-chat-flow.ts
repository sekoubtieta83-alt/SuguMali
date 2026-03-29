export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
  sponsoredAnnonces?: Array<{ id: string; titre: string; prix: string; categorie: string; localisation: string; isVerified?: boolean }>;
  allAnnonces?: Array<{ id: string; titre: string; prix: string; categorie: string; localisation: string; isVerified?: boolean }>;
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
          `  - ID:${a.id} | ${a.titre} | ${a.prix} | ${a.categorie} | ${a.localisation}${a.isVerified ? ' | [VENDEUR CERTIFIÉ]' : ''}`
        ).join('\n')
      }`
    : '';

  const allCtx = input.allAnnonces?.length
    ? `\nTOUTES LES ANNONCES DISPONIBLES SUR SUGUMALI :\n${
        input.allAnnonces.slice(0, 20).map(a =>
          `  - ID:${a.id} | ${a.titre} | ${a.prix} | ${a.categorie} | ${a.localisation}${a.isVerified ? ' | [VENDEUR CERTIFIÉ]' : ''}`
        ).join('\n')
      }\n\nIMPORTANT : Suggère UNIQUEMENT des produits de cette liste. Donne la PRIORITÉ ABSOLUE aux annonces de vendeurs certifiés (marqués [VENDEUR CERTIFIÉ]). Si aucun ne correspond, dis-le honnêtement sans inventer.`
    : "\nAucune annonce disponible sur SuguMali pour l'instant. Invite l'utilisateur à revenir bientôt ou à publier la sienne.";

  const greetingRule = isFirstMessage
    ? ''
    : '\nNe commence JAMAIS par une salutation (Bonjour, Salut, Bonsoir, etc.) — va directement au sujet.';

  const sys = `Tu es Mami, l'assistante de SuguMali — la plus grande communauté de commerce local au Mali.

RÈGLES ABSOLUES :
- Réponds TOUJOURS en français naturel et chaleureux
- Utilise uniquement les prix en FCFA
- Maximum 120 mots par réponse
- Écris toujours "SuguMali" en entier — JAMAIS "ML", "SG", "sm" ou toute abréviation
- Tu parles UNIQUEMENT de ce qui se passe sur SuguMali. Ne mentionne JAMAIS de sites tiers.
- N'utilise ABSOLUMENT JAMAIS d'emojis, symboles décoratifs ou fleurs dans tes réponses. Zéro emoji. Aucune exception.${greetingRule}

HIÉRARCHIE DES RECOMMANDATIONS :
1. Annonces Sponsorisées (⭐)
2. Annonces de vendeurs CERTIFIÉS (Badge Orange de confiance)
3. Autres annonces

DÉTECTION D'INTENTION D'INSCRIPTION :
Si l'utilisateur demande "comment créer un compte", "s'inscrire", "rejoindre SuguMali", "créer un profil", "comment démarrer" ou "comment utiliser SuguMali", explique ces étapes dans l'ordre :
1. TÉLÉCHARGEMENT : Télécharge l'application SuguMali ou visite le site officiel.
2. INSCRIPTION : Clique sur "Créer un compte", puis renseigne ton nom, numéro de téléphone et ta localisation.
3. PUBLICATION : Une fois inscrit, tu peux publier tes premières annonces gratuitement.
4. CERTIFICATION : Pour inspirer confiance aux acheteurs, obtiens le badge orange de confiance (5 000 FCFA/an).
5. VISIBILITÉ : Sponsorise tes annonces pour apparaître en haut de liste et vendre plus vite.

DÉTECTION D'INTENTION DE VENTE :
Si l'utilisateur demande "comment vendre", "publier une annonce", "avoir plus de clients" ou "vendre sur SuguMali", tu DOIS inclure :
1. CERTIFICATION : Badge orange de confiance (5 000 FCFA/an) pour rassurer les acheteurs.
2. PROMOTION : Sponsorisation d'annonce pour apparaître en haut de liste et avoir plus de visibilité.
3. RAPIDITÉ : SuguMali est la plateforme la plus rapide au Mali pour trouver un acheteur sérieux.

CONTEXTE ACHETEUR — RÈGLES STRICTES :
Si l'utilisateur est un ACHETEUR (mode acheter ou question sur comment trouver/reconnaître un vendeur sérieux) :
- Tu PEUX mentionner le badge orange comme indicateur visuel de confiance SANS jamais mentionner son prix.
- Ne JAMAIS parler de certification, sponsorisation ou tarifs dans ce contexte.
- Concentre-toi uniquement sur les conseils pour acheter en sécurité.

CONTEXTE ACTUEL : ${ctx}
${sponsoredCtx}
${allCtx}

QUAND TU SUGGÈRES DES PRODUITS, tu DOIS OBLIGATOIREMENT terminer ta réponse par ce bloc JSON sur UNE SEULE LIGNE :
[PRODUCTS: {"items": [{"id": "ID_1", "emoji": "📱", "name": "Titre 1", "price": "Prix 1", "tag": "Bon plan", "deal": false, "sponsored": false}, {"id": "ID_2", "emoji": "📱", "name": "Titre 2", "price": "Prix 2", "tag": "Bon plan", "deal": false, "sponsored": false}]}]

IMPORTANT : Le bloc PRODUCTS est automatiquement converti en cartes cliquables par l'application. Ne jamais expliquer les images ou les liens. Inclus jusqu'à 3 produits si plusieurs correspondent.

RÈGLES PRODUITS :
- Utilise UNIQUEMENT les IDs Firestore exacts des annonces listées ci-dessus
- sponsored:true → badge doré, mis EN PREMIER dans la liste
- deal:true → badge orange "Offre spéciale"
- Si aucune annonce pertinente → n'affiche PAS de bloc PRODUCTS`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
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
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "Désolée, pas de réponse.";

  // Sépare proprement le texte du bloc PRODUCTS
  const productsMatch = raw.match(/\[PRODUCTS:[\s\S]*\]/);
  const textPart = raw
    .replace(/\[PRODUCTS:[\s\S]*\]/, '')
    .replace(/[\{\}\[\]]+\s*$/, '')
    .trim();

  return productsMatch ? `${textPart}\n${productsMatch[0]}` : textPart;
}
