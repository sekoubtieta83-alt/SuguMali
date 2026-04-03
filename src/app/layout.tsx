import type { Metadata } from "next";
import "./globals.css";
import { LayoutClientWrapper } from "@/components/layout-client-wrapper";

export const metadata: Metadata = {
  metadataBase: new URL('https://sugumali.com'),
  title: {
    default: "SuguMali — Le Marché n°1 au Mali",
    template: "%s | SuguMali"
  },
  description: "La plateforme de confiance pour acheter et vendre au Mali. Rejoignez notre communauté de commerce local.",
  alternates: {
    canonical: '/',
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuguMali",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_ML',
    url: 'https://sugumali.com',
    siteName: 'SuguMali',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  );
}
