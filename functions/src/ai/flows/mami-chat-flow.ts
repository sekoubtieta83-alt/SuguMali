/**
 * @fileOverview Flux de chat pour l'assistante Mami de SuguMali.
 * Gère le nettoyage de l'historique et la génération de réponses via l'API REST Gemini.
 */

export async function mamiChatFlow(input: {
  messages: { role: 'user' | 'model'; content: string }[];
  mode?: 'acheter' | 'vendre';
}): Promise<string> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error('Clé API manquante');

  // Nettoyage de l'historique : Gemini exige que le premier message soit 'user'
  let msgs = [...input.messages];
  while (msgs.length > 0 && msgs[0].role === 'model') {
    msgs.shift();
  }

  // Assurer l'alternance stricte des rôles (user -> model -> user)
  msgs = msgs.reduce((acc: typeof msgs, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role) return acc;
    acc.push(msg);
    return acc;
  }, []);

  if (msgs.length === 0) {
    return "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider aujourd'hui ?";
  }

  const modeContext = input.mode === 'vendre'
    ? "L'utilisateur souhaite VENDRE. Donne des conseils précis sur la fixation du prix en FCFA, la rédaction d'une annonce attractive, l'importance de belles photos et la sécurité lors de la transaction physique."
    : "L'utilisateur souhaite ACHETER ou pose une question générale. Aide-le à trouver les meilleurs articles et suggère des produits avec leurs prix en FCFA.";

  const systemInstruction = `Tu es Mami, l'assistante officielle et bienveillante de SuguMali 🇲🇱.
Ton but est d'aider les Maliens à faire de bonnes affaires en toute sécurité.

Directives :
- Sois amicale, utilise un ton chaleureux ("Mami") mais reste professionnelle.
- Réponds TOUJOURS en français.
- Utilise TOUJOURS la monnaie FCFA.
- Termine TOUJOURS ta phrase complètement avant de t'arrêter. Ne coupe jamais ton message au milieu.
- Maximum 200 mots par réponse.

Contexte actuel : ${modeContext}

Si tu suggères des articles ou des bons plans, termine TOUJOURS ton message par ce bloc JSON exact pour l'affichage :
[PRODUCTS: {"items": [{"emoji": "📱", "name": "Nom du produit", "price": "75 000 FCFA", "tag": "Bon plan", "deal": false}]}]`;

  // Appel direct à l'API REST pour une fiabilité maximale dans l'environnement Functions
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: msgs.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
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
  
  // Log du finishReason pour le débogage en production
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason !== 'STOP') {
    console.log('Gemini generation finished with reason:', finishReason);
  }
  
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!responseText) {
    throw new Error("Gemini n'a pas renvoyé de contenu.");
  }

  return responseText;
}