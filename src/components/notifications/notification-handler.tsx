'use client';

import { useEffect } from 'react';
import { getMessaging, onMessage, isSupported } from 'firebase/messaging';
import { useFirebaseApp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function NotificationHandler() {
  const { toast } = useToast();
  const app = useFirebaseApp();

  useEffect(() => {
    const setupMessaging = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !app) {
        return;
      }

      try {
        // Vérifier si le navigateur supporte les notifications avant d'initialiser Messaging
        const supported = await isSupported();
        if (!supported) {
          console.log('Firebase Messaging is not supported in this browser.');
          return;
        }

        const messaging = getMessaging(app);

        const unsubscribeOnMessage = onMessage(messaging, (payload) => {
          console.log('Foreground message received.', payload);
          toast({
            title: payload.notification?.title || 'Nouvelle notification',
            description: payload.notification?.body,
          });
        });

        return unsubscribeOnMessage;
      } catch (error) {
        console.error('Error setting up Firebase Messaging:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupMessaging().then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [app, toast]);

  return null; // This is a handler component, it doesn't render anything
}
