export const metadata = {
  title: "Politique de Confidentialité — SuguMali",
  description: "Politique de confidentialité de la plateforme SuguMali",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
      <h1 className="text-3xl font-black mb-2 italic">Politique de Confidentialité</h1>
      <p className="text-muted-foreground text-sm mb-10 tracking-widest uppercase">Dernière mise à jour : Mars 2024</p>

      <div className="space-y-10 leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
            Introduction
          </h2>
          <p>
            Bienvenue sur <strong>SuguMali</strong>. La protection de votre vie privée est une priorité absolue pour nous. 
            Cette politique détaille comment nous traitons vos informations lorsque vous utilisez notre plateforme 
            d'annonces et d'e-commerce.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
            Collecte des données
          </h2>
          <p className="mb-4">
            Nous collectons uniquement les informations nécessaires au bon fonctionnement de nos services :
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Authentification :</strong> Nous collectons votre adresse e-mail, votre nom et votre photo de profil lorsque vous créez un compte ou utilisez l'authentification Google.
            </li>
            <li>
              <strong>Informations d'annonce :</strong> Les données relatives aux produits que vous publiez 
              (titre, prix, localisation, photos).
            </li>
            <li>
              <strong>Communications :</strong> Les échanges via notre assistante Mami ou le support technique.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
            Hébergement et Sécurité
          </h2>
          <p>
            Toutes vos données sont stockées et sécurisées sur <strong>Firebase</strong> (un service de Google Cloud). 
            Firebase garantit des standards de sécurité de niveau industriel, incluant le chiffrement des données 
            au repos et en transit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">4</span>
            Partage des données
          </h2>
          <p className="p-4 bg-muted/50 rounded-2xl border-l-4 border-accent italic">
            "SuguMali s'engage formellement à ne jamais vendre, louer ou partager vos informations personnelles 
            avec des tiers à des fins commerciales."
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">5</span>
            Vos Droits
          </h2>
          <p>
            Conformément aux lois en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression 
            de vos données. Vous pouvez modifier votre profil ou supprimer votre compte et vos annonces 
            à tout moment depuis votre tableau de bord.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="bg-accent text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">6</span>
            Contact
          </h2>
          <p>
            Pour toute question concernant vos données, contactez-nous à l'adresse : 
            <a href="mailto:sekoubtieta83@gmail.com" className="text-accent underline ml-1">sekoubtieta83@gmail.com</a>
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SuguMali — Bamako, Mali.</p>
        <a href="/" className="text-xs font-bold text-accent uppercase tracking-tighter">Retour à l'accueil</a>
      </div>
    </main>
  );
}
