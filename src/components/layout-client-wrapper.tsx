'use client';

import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { NotificationHandler } from '@/components/notifications/notification-handler';
import { SupportChatWidget } from '@/components/support-chat-widget';
import { SplashScreen } from '@/components/splash-screen';
import { MamiProvider } from '@/components/mami-context';

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <>
      <SplashScreen />
      <FirebaseClientProvider>
        <MamiProvider>
          <NotificationHandler />
          {children}
          <SupportChatWidget />
          <Toaster />
        </MamiProvider>
      </FirebaseClientProvider>
      <footer className="w-full py-8 px-6 border-t border-border bg-background text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center gap-6 font-bold">
          <a href="/privacy" className="underline hover:text-foreground transition-colors">
            Politique de confidentialité
          </a>
          <a href="/terms" className="underline hover:text-foreground transition-colors">
            Conditions d&apos;utilisation
          </a>
        </div>
        <span>© {year || '...'} SuguMali — Bamako, Mali.</span>
      </footer>
    </>
  );
}
