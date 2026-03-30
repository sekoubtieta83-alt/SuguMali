'use client';

import type { Metadata, Viewport } from 'next';
import { useState, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { NotificationHandler } from '@/components/notifications/notification-handler';
import { SupportChatWidget } from '@/components/support-chat-widget';
import { SplashScreen } from '@/components/splash-screen';
import { MamiProvider } from '@/components/mami-context';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
        <meta name="theme-color" content="#FF8C00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SuguMali" />
      </head>
      <body className="antialiased">
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
      </body>
    </html>
  );
}
