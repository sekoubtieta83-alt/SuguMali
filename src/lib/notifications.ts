'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * La clé VAPID est désormais récupérée depuis les variables d'environnement.
 * Cela permet de ne pas l'exposer directement dans le code source.
 */
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BAiFcmpKGf9k5kGHwPj53aY5ljE9pGshdbCcFvEgBQiZ6NW6AAp2ilLBE9E6Jirta9TLZL1bGA-rmUAuWjz8P2I';

export const requestNotificationPermission = async (
  app: FirebaseApp,
  user: User,
  firestore: Firestore
): Promise<string> => {
  if (!VAPID_KEY || VAPID_KEY.startsWith('YOUR_VAPID_KEY')) {
    throw new Error('Clé VAPID non configurée. Veuillez la définir dans vos variables d\'environnement.');
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
