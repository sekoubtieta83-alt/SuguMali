export const metadata = {
  title: "Conditions d'utilisation — SuguMali",
  description: "Conditions d'utilisation de SuguMali",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
      <h1 className="text-3xl font-black mb-2">Conditions d'utilisation</h1>
      <p className="text-muted-foreground text-sm mb-10">Dernière mise à jour : Mars 2024</p>

      <section className="mb-8">
        <h2 className="text-xl font-black mb-3">1. Acceptation des conditions</h2>
        <p className="text-muted-foreground leading-relaxed">
          En accédant à SuguMali et en utilisant nos services, vous acceptez d'être lié par ces conditions d'utilisation. 
          Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black mb-3">2. Description du service</h2>
        <p className="text-muted-foreground leading-relaxed">
          SuguMali est une plateforme de commerce local au Mali permettant aux utilisateurs
          d'acheter et de vendre des produits et services. Nous mettons en relation des acheteurs
          et des vendeurs et proposons des outils pour faciliter les transactions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black mb-3">3. Règles de publication</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          En publiant une annonce sur SuguMali, vous vous engagez à :
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
          <li>Fournir des informations exactes sur le produit ou service.</li>
          <li>Ne publier que des produits légaux et conformes à la législation malienne.</li>
          <li>Utiliser uniquement des photos dont vous détenez les droits.</li>
          <li>Respecter les prix affichés en FCFA.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-black mb-3">4. Limitation de responsabilité</h2>
        <p className="text-muted-foreground leading-relaxed">
          SuguMali est une plateforme de mise en relation. Nous ne sommes pas partie prenante
          dans les transactions entre acheteurs et vendeurs. Nous recommandons de toujours
          vérifier l'identité de votre interlocuteur et de ne jamais envoyer d'argent à l'avance.
        </p>
      </section>

      <div className="border-t border-border pt-8 mt-8 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SuguMali. Tous droits réservés.
        </p>
        <a href="/" className="text-xs font-bold text-accent uppercase">Accueil</a>
      </div>
    </main>
  );
}
