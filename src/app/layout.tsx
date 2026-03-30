import type { Metadata } from "next";
import "./globals.css";
import { LayoutClientWrapper } from "@/components/layout-client-wrapper";

export const metadata: Metadata = {
  title: "SuguMali",
  description: "Le Marché - Votre plateforme e-commerce",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SuguMali",
  },
  icons: {
    apple: "/apple-icon.png",
    icon: "/icon-192.png",
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
