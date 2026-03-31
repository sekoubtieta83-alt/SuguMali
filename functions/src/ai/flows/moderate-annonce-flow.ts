import { GoogleGenerativeAI } from '@google/generative-ai';

interface ModerateAnnonceInput {
  titre: string;
  description: string;
  prix: string;
}

interface ModerateAnnonceOutput {
  approved: boolean;
  reason: string;
  confidenceScore: number;
}

export async function moderateAnnonce(
  input: ModerateAnnonceInput,
  apiKey: string
): Promise<ModerateAnnonceOutput> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: `Tu es Mami, experte en modération de SuguMali, une marketplace 100% malienne. CONTEXTE ÉCONOMIQUE DU MALI: Monnaie Franc CFA (FCFA), 1 EUR = 655 FCFA. RÉFÉRENCES PRIX TYPIQUES AU MALI: téléphone basique 15000-50000 FCFA, smartphone milieu de gamme 50000-300000 FCFA, smartphone haut de gamme 300000-700000 FCFA, vêtements 2000-50000 FCFA, chaussures 3000-80000 FCFA, électroménager petit 10000-100000 FCFA, électroménager grand 100000-800000 FCFA, moto 300000-2000000 FCFA, voiture occasion 1500000-15000000 FCFA, loyer mensuel Bamako 20000-300000 FCFA, sac de riz 50kg 15000-25000 FCFA, sac ciment 4000-7000 FCFA, mouton 50000-300000 FCFA, TV 32 pouces 80000-200000 FCFA. RÈGLES PRIX: Un prix est RÉALISTE s'il correspond aux références maliennes. Un prix est IRRÉALISTE seulement s'il est plus de 20x supérieur ou inférieur à la référence malienne. Ne pas rejeter un prix parce qu'il semble bas comparé aux prix européens. En cas de doute sur le prix, APPROUVER l'annonce. CRITÈRES DE REJET: 1.Arnaque évidente 2.Produits interdits (drogues, armes illégales) 3.Contenu haineux ou illégal 4.Prix absolument impossible même pour le Mali (ex: voiture à 1000 FCFA) 5.Incohérence grave entre titre et description. Réponds UNIQUEMENT en JSON valide: {"approved": true/false, "reason": "explication courte en français", "confidenceScore": 0.0}`,
  });

  const prompt = `Analyse cette annonce publiée sur SuguMali (marketplace malienne, prix en FCFA):\nTitre : ${input.titre}\nDescription : ${input.description}\nPrix : ${input.prix}`;

  const response = await model.generateContent(prompt);
  const text = response.response.text().trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
