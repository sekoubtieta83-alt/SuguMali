'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

// IMPORTANT: You need to generate this key in your Firebase project settings
// under Cloud Messaging > Web configuration > Web Push certificates.
const VAPID_KEY = 'BAiFcmpKGf9k5kGHwPj53aY5ljE9pGshdbCcFvEgBQiZ6NW6AAp2ilLBE9E6Jirta9TLZL1bGA-rmUAuWjz8P2I';

export const requestNotificationPermission = async (
  app: FirebaseApp,
  user: User,
  firestore: Firestore
): Promise<string> => {
  if (VAPID_KEY.startsWith('YOUR_VAPID_KEY')) {
     toast({
        variant: 'destructive',
        title: 'Configuration requise',
        description: "La clé VAPID pour les notifications push n'a pas été définie.",
        duration: 5000,
      });
    throw new Error('VAPID key not configured.');
  }

  if (!('Notification' in window)) {
    throw new Error('Ce navigateur ne supporte pas les notifications.');
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Votre navigateur ne supporte pas les notifications push Firebase.');
  }

  const messaging = getMessaging(app);

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    throw new Error('La permission pour les notifications a été refusée.');
  }

  try {
    const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
    });

    if (currentToken) {
        console.log('FCM Token received:', currentToken);
        // Save the token to Firestore
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            fcmTokens: arrayUnion(currentToken),
        });
        return currentToken;
    } else {
        throw new Error('Aucun token de notification disponible. Veuillez autoriser les notifications.');
    }
  } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      if ((err as Error).message.includes("messaging/unsupported-browser")) {
          throw new Error("Ce navigateur ne supporte pas les notifications push.");
      }
      throw new Error("Une erreur est survenue lors de l'obtention du token de notification.");
  }
};
