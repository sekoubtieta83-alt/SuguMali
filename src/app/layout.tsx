import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { NotificationHandler } from '@/components/notifications/notification-handler';
import { SupportChatWidget } from '@/components/support-chat-widget';
import { SplashScreen } from '@/components/splash-screen';
import { MamiProvider } from '@/components/mami-context';

export const metadata: Metadata = {
  title: 'SuguMali - Le MALI achète et vend ici',
  description: 'Votre plateforme de confiance pour acheter et vendre localement au Mali.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
          <span>© {new Date().getFullYear()} SuguMali — Bamako, Mali.</span>
        </footer>
      </body>
    </html>
  );
}
