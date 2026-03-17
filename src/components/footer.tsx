'use client';

import { useMami } from '@/components/mami-context';
import { MessageCircle } from 'lucide-react';

const CATEGORIES = [
  { label: 'Véhicules',    question: 'Je cherche des véhicules disponibles sur SuguMali' },
  { label: 'Immobilier',   question: 'Je cherche des annonces immobilières sur SuguMali' },
  { label: 'Électronique', question: 'Je cherche des produits électroniques sur SuguMali' },
  { label: 'Mode & Beauté',question: 'Je cherche des articles de mode et beauté sur SuguMali' },
];

const SUPPORT = [
  { label: 'Comment ça marche ?',   question: 'Comment fonctionne SuguMali ? Explique-moi les étapes pour acheter ou vendre.' },
  { label: 'Conseils de sécurité',  question: 'Quels sont les conseils de sécurité pour acheter et vendre sur SuguMali ?' },
];

export default function Footer() {
  const { openMami } = useMami();

  return (
    <footer className="bg-gray-900 text-gray-300 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">

        {/* Brand */}
        <div className="space-y-6">
          <span className="text-3xl font-black text-white tracking-tighter">
            Sugu<span className="text-accent">Mali</span>
          </span>
          <p className="text-sm leading-relaxed opacity-80 max-w-sm">
            La plateforme de confiance numéro 1 pour acheter et vendre au Mali. Connectez-vous avec votre communauté et faites de bonnes affaires en toute sécurité.
          </p>
          <a 
            href="https://wa.link/5hdjag" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg shadow-[#25D366]/20 w-fit"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp SuguMali
          </a>
        </div>

        {/* Catégories → Mami */}
        <div className="md:pl-8">
          <h4 className="text-white font-black mb-6 text-xl tracking-tight uppercase">Catégories</h4>
          <ul className="space-y-4 text-sm font-medium">
            {CATEGORIES.map(({ label, question }) => (
              <li key={label}
                className="hover:text-accent cursor-pointer transition-all flex items-center gap-2 group w-fit"
                onClick={() => openMami(question)}
              >
                <span className="h-1 w-1 rounded-full bg-accent scale-0 group-hover:scale-100 transition-transform"></span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Aide & Support → Mami */}
        <div className="md:pl-8">
          <h4 className="text-white font-black mb-6 text-xl tracking-tight uppercase">Aide & Support</h4>
          <ul className="space-y-4 text-sm font-medium">
            {SUPPORT.map(({ label, question }) => (
              <li key={label}
                className="hover:text-accent cursor-pointer transition-all flex items-center gap-2 group w-fit"
                onClick={() => openMami(question)}
              >
                <span className="h-1 w-1 rounded-full bg-accent scale-0 group-hover:scale-100 transition-transform"></span>
                {label}
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] sm:text-xs text-gray-500 font-medium">
        <div>© 2026 SuguMali — Le Mali achète et vend ici.</div>
        <div className="flex gap-6">
          <span className="hover:text-gray-400 cursor-help transition-colors" onClick={() => openMami("Quelles sont les conditions d'utilisation ?")}>Conditions</span>
          <span className="hover:text-gray-400 cursor-help transition-colors" onClick={() => openMami("Quelle est votre politique de confidentialité ?")}>Confidentialité</span>
        </div>
      </div>
    </footer>
  );
}
