export async function analyzeImageFlow(input: {
  imageBase64: string;
  apiKey: string;
}): Promise<{
  titre: string;
  description: string;
  categorie: string;
}> {
  const { imageBase64, apiKey } = input;

  // Extraire le type MIME et les données base64
  const match = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error('Format image invalide');
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = `Tu es Mami, experte en commerce local malien sur SuguMali.

Analyse cette image de produit et génère EN JSON UNIQUEMENT (sans texte avant ou après, sans markdown) :
{
  "titre": "Titre court et accrocheur du produit (max 60 caractères)",
  "description": "Description vendeuse et attrayante pour les acheteurs maliens (2-3 phrases max, en français naturel, mentionne l'état visible, les caractéristiques clés)",
  "categorie": "Une seule catégorie parmi : Téléphones & Tablettes, Ordinateurs & Portables, Électronique, Véhicules, Immobilier, Mode & Beauté, Maison & Jardin, Sports & Loisirs, Emploi, Services, Animaux, Autre"
}

RÈGLES :
- Écris en français naturel et chaleureux
- Le titre doit donner envie d'acheter
- La description doit mettre en valeur le produit
- Si tu ne reconnais pas le produit, génère quand même quelque chose de plausible
- Réponds UNIQUEMENT avec le JSON, rien d'autre`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini Vision Error:', errText);
    throw new Error(`Erreur Gemini Vision: ${res.statusText}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Nettoyer et parser le JSON
  const clean = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Fallback si le JSON est invalide
    return {
      titre: '',
      description: '',
      categorie: 'Autre',
    };
  }
}