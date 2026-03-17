'use client';

import { MessageCircle } from 'lucide-react';
import { useMami } from '@/components/mami-context';

const CATEGORIES = [
  { label: 'Véhicules',    question: 'Je cherche des véhicules disponibles sur SuguMali' },
  { label: 'Immobilier',   question: 'Je cherche des annonces immobilières sur SuguMali' },
  { label: 'Électronique', question: 'Je cherche des produits électroniques sur SuguMali' },
  { label: 'Mode & Beauté',question: 'Je cherche des articles de mode et beauté sur SuguMali' },
];

const SUPPORT = [
  { label: 'Comment ça marche ?',   question: 'Comment fonctionne SuguMali ? Explique-moi les étapes pour acheter ou vendre.' },
  { label: 'Conseils de sécurité',  question: 'Quels sont les conseils de sécurité pour acheter et vendre sur SuguMali ?' },
  { label: 'Contactez-nous',        question: 'Je voudrais contacter le support de SuguMali. Comment puis-je vous joindre ?' },
];

export default function Footer() {
  const { openMami } = useMami();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="space-y-4">
          <span className="text-2xl font-black text-white">
            Sugu<span className="text-accent">Mali</span>
          </span>
          <p className="text-sm leading-relaxed">
            La plateforme de confiance pour acheter et vendre au Mali. Connectez-vous avec votre communauté et faites de bonnes affaires en toute sécurité.
          </p>
          <div className="flex gap-4">
            <a 
              href="https://wa.link/5hdjag" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-transform hover:scale-110"
            >
              <MessageCircle className="h-6 w-6 cursor-pointer text-green-500 hover:text-green-400" />
            </a>
          </div>
        </div>

        {/* Catégories → Mami */}
        <div>
          <h4 className="text-white font-bold mb-4 italic">Catégories</h4>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map(({ label, question }) => (
              <li key={label}
                className="hover:text-accent cursor-pointer transition-colors flex items-center gap-1 group"
                onClick={() => openMami(question)}
              >
                <span className="opacity-0 group-hover:opacity-100 text-accent text-xs transition-opacity">✦</span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Aide & Support → Mami */}
        <div>
          <h4 className="text-white font-bold mb-4 italic">Aide & Support</h4>
          <ul className="space-y-2 text-sm">
            {SUPPORT.map(({ label, question }) => (
              <li key={label}
                className="hover:text-accent cursor-pointer transition-colors flex items-center gap-1 group"
                onClick={() => openMami(question)}
              >
                <span className="opacity-0 group-hover:opacity-100 text-accent text-xs transition-opacity">✦</span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile */}
        <div>
          <h4 className="text-white font-bold mb-4 italic">SuguMali Mobile</h4>
          <p className="text-sm mb-4">Téléchargez l'application pour rester connecté partout.</p>
          <div className="flex flex-col gap-2">
            <button className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200">
              Google Play
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
        © 2026 SuguMali. Tous droits réservés.
      </div>
    </footer>
  );
}
