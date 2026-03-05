
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { NotificationHandler } from '@/components/notifications/notification-handler';
import { SupportChatWidget } from '@/components/support-chat/support-chat-widget';

export const metadata: Metadata = {
  title: 'SuguMali - Le MALI achète et vend ici',
  description: 'Votre plateforme de confiance pour acheter et vendre localement au Mali.',
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <NotificationHandler />
          {children}
          <Toaster />
          <SupportChatWidget />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
