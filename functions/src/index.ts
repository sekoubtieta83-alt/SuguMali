import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

if (!admin.apps.length) admin.initializeApp();

export const mamiChat = onCall({
  cors: true,
  region: 'us-central1',
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {
  try {
    const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;
    if (!messages?.length) throw new HttpsError('invalid-argument', 'Messages requis');

    const apiKey = GOOGLE_GENAI_API_KEY.value();

    const response = await mamiChatFlow(
      {
        messages,
        mode: mode || 'acheter',
        sponsoredAnnonces: sponsoredAnnonces || [],
        allAnnonces: allAnnonces || [],
      },
      apiKey
    );

    return { success: true, text: response, response };
  } catch (error: any) {
    console.error('mamiChat error:', error.message || error);
    throw new HttpsError('internal', error.message || 'Erreur interne');
  }
});