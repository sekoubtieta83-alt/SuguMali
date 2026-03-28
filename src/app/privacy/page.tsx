'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, Eye, Bell, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function PrivacyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Collecte des données",
      icon: <Database className="h-5 w-5 text-accent" />,
      content: "Nous collectons les informations que vous nous fournissez directement lors de la création de votre compte (nom, adresse e-mail, numéro de téléphone) et lors de la publication d'annonces (photos, descriptions, prix, localisation). Nous collectons également des données techniques comme votre adresse IP et votre type de navigateur pour assurer la sécurité de notre plateforme."
    },
    {
      title: "2. Utilisation des informations",
      icon: <Eye className="h-5 w-5 text-accent" />,
      content: "Vos informations sont utilisées pour : gérer votre compte, publier et promouvoir vos annonces, vous permettre de communiquer avec d'autres utilisateurs via WhatsApp, et améliorer nos services. Nous utilisons l'IA (Mami) pour analyser vos annonces et vous aider à mieux vendre."
    },
    {
      title: "3. Sécurité des données",
      icon: <Lock className="h-5 w-5 text-accent" />,
      content: "La sécurité de vos données est notre priorité. Nous utilisons les services sécurisés de Google Firebase pour stocker vos informations et vos médias. L'accès à vos données personnelles est strictement limité aux employés autorisés et aux processus nécessaires au bon fonctionnement du service."
    },
    {
      title: "4. Partage avec des tiers",
      icon: <ShieldCheck className="h-5 w-5 text-accent" />,
      content: "SuguMali ne vend jamais vos données personnelles à des tiers. Vos informations de contact (numéro WhatsApp) ne sont partagées qu'avec les acheteurs potentiels lorsque vous publiez une annonce, afin de faciliter la transaction."
    },
    {
      title: "5. Vos droits",
      icon: <Bell className="h-5 w-5 text-accent" />,
      content: "Vous avez le droit d'accéder à vos données, de les rectifier ou de demander leur suppression à tout moment via votre profil utilisateur. Pour toute demande spécifique concernant vos données, vous pouvez nous contacter via le support WhatsApp officiel."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="h-7 w-7 transition-transform group-hover:scale-110" />
            <span className="text-xl font-black text-foreground tracking-tight">Sugu<span className="text-accent">Mali</span></span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-xl font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Politique de <span className="text-accent">Confidentialité</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Dernière mise à jour : 27 Mars 2026
          </p>
          <div className="w-20 h-1.5 bg-accent mx-auto rounded-full"></div>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed text-foreground/80 mb-10">
            Chez SuguMali, nous accordons une importance capitale à la protection de votre vie privée. Cette politique détaille nos pratiques concernant la collecte, l'utilisation et la protection de vos données personnelles sur notre plateforme.
          </p>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <section key={idx} className="space-y-4 p-6 rounded-3xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-xl shadow-sm border border-border/50">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold m-0">{section.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-3xl bg-accent/5 border border-accent/20 text-center">
            <h3 className="text-xl font-bold text-accent mb-4">Une question ?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Si vous avez des questions concernant notre politique de confidentialité, n'hésitez pas à nous contacter directement.
            </p>
            <Button asChild className="rounded-2xl font-black px-8 h-12 bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20">
              <a href="https://wa.link/5hdjag" target="_blank" rel="noopener noreferrer">
                Nous contacter sur WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-12 border-t text-center text-xs text-muted-foreground">
        <p>© 2026 SuguMali. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
