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
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuguMali",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#FF8C00',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_ML',
    url: 'https://sugumali.com',
    siteName: 'SuguMali',
  },
  other: {
    'msapplication-TileColor': '#FF8C00',
    'theme-color': '#ffffff',
  }
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
