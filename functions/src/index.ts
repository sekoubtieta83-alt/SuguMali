import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { mamiChatFlow } from './ai/flows/mami-chat-flow';

const GOOGLE_GENAI_API_KEY = defineSecret("GOOGLE_GENAI_API_KEY");

if (!admin.apps.length) admin.initializeApp();

export const mamiChat = onCall({
  cors: true,
  region: 'europe-west1',
  enforceAppCheck: false,
  secrets: [GOOGLE_GENAI_API_KEY],
  timeoutSeconds: 30,
  memory: '512MiB',
}, async (request) => {
  const apiKey = GOOGLE_GENAI_API_KEY.value();
  const { messages, mode, sponsoredAnnonces, allAnnonces } = request.data;

  const response = await mamiChatFlow(
    { messages, mode, sponsoredAnnonces, allAnnonces },
    apiKey
  );

  return { text: response };
});