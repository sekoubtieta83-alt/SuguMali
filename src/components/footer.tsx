
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div className="space-y-4">
          <span className="text-2xl font-black text-white">
            Sugu<span className="text-accent">Mali</span>
          </span>
          <p className="text-sm leading-relaxed">
            La plateforme de confiance pour acheter et vendre au Mali. Connectez-vous avec votre communauté et faites de bonnes affaires en toute sécurité.
          </p>
          <div className="flex gap-4">
            <Facebook className="h-5 w-5 cursor-pointer hover:text-accent" />
            <Instagram className="h-5 w-5 cursor-pointer hover:text-accent" />
            <MessageCircle className="h-5 w-5 cursor-pointer hover:text-green-500" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 italic">Catégories</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Véhicules</li>
            <li className="hover:text-white cursor-pointer">Immobilier</li>
            <li className="hover:text-white cursor-pointer">Électronique</li>
            <li className="hover:text-white cursor-pointer">Mode & Beauté</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 italic">Aide & Support</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Comment ça marche ?</li>
            <li className="hover:text-white cursor-pointer">Conseils de sécurité</li>
            <li className="hover:text-white cursor-pointer">Contactez-nous</li>
          </ul>
        </div>

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
