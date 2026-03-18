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
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: 'Tu es Mami, experte en moderation de SuguMali. Analyse les annonces. CRITERES: 1.Arnaques 2.Prix irrealistes 3.Produits interdits 4.Contenu haineux 5.Coherence. Reponds UNIQUEMENT en JSON: {"approved": true/false, "reason": "explication", "confidenceScore": 0.0}',
  });
  const prompt = 'Analyse cette annonce:\nTitre : ' + input.titre + '\nDescription : ' + input.description + '\nPrix : ' + input.prix;
  const response = await model.generateContent(prompt);
  const text = response.response.text().trim();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}