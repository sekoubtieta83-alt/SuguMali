export const metadata = {
    title: "Conditions d'utilisation — SuguMali",
    description: "Conditions d'utilisation de SuguMali",
  };
  
  export default function TermsPage() {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
        <h1 className="text-3xl font-black mb-2">Conditions d'utilisation</h1>
        <p className="text-muted-foreground text-sm mb-10">Dernière mise à jour : 28 mars 2026</p>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">1. Acceptation des conditions</h2>
          <p className="text-muted-foreground leading-relaxed">
            En accédant à SuguMali et en utilisant nos services disponibles sur{' '}
            <a href="https://sugumali.com" className="text-accent underline">sugumali.com</a>,
            vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas
            ces conditions, veuillez ne pas utiliser notre plateforme.
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
          <h2 className="text-xl font-black mb-3">3. Création de compte</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>Vous devez avoir au moins 18 ans pour créer un compte</li>
            <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
            <li>Vous devez fournir des informations exactes et à jour</li>
            <li>Un seul compte par personne est autorisé</li>
            <li>Vous êtes responsable de toutes les activités effectuées depuis votre compte</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">4. Règles de publication d'annonces</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            En publiant une annonce sur SuguMali, vous vous engagez à :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>Fournir des informations exactes sur le produit ou service proposé</li>
            <li>Ne publier que des produits légaux et conformes à la législation malienne</li>
            <li>Utiliser uniquement des photos qui vous appartiennent ou pour lesquelles vous avez les droits</li>
            <li>Ne pas publier de contenu trompeur, frauduleux ou offensant</li>
            <li>Respecter les prix affichés en FCFA</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            SuguMali se réserve le droit de supprimer toute annonce ne respectant pas ces règles.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">5. Contenu interdit</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">Il est strictement interdit de publier :</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
            <li>Des armes, munitions ou explosifs</li>
            <li>Des substances illicites ou médicaments sans ordonnance</li>
            <li>Du contenu pornographique ou à caractère sexuel</li>
            <li>Des animaux sauvages ou protégés</li>
            <li>Des produits contrefaits ou volés</li>
            <li>Tout contenu incitant à la haine, la discrimination ou la violence</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">6. Transactions et paiements</h2>
          <p className="text-muted-foreground leading-relaxed">
            SuguMali est une plateforme de mise en relation. Nous ne sommes pas partie prenante
            dans les transactions entre acheteurs et vendeurs. Nous vous recommandons de :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed mt-3">
            <li>Vérifier l'identité de votre interlocuteur avant toute transaction</li>
            <li>Privilégier les échanges en personne dans des lieux publics sûrs</li>
            <li>Ne jamais envoyer d'argent à l'avance sans avoir vu le produit</li>
            <li>Faire confiance aux vendeurs certifiés (badge orange SuguMali)</li>
          </ul>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">7. Badge de certification et sponsorisation</h2>
          <p className="text-muted-foreground leading-relaxed">
            SuguMali propose des services payants optionnels :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed mt-3">
            <li>
              <span className="font-bold text-foreground">Badge de confiance</span> — 5 000 FCFA/an,
              attribué après vérification de votre identité
            </li>
            <li>
              <span className="font-bold text-foreground">Sponsorisation d'annonces</span> — tarif variable,
              permet à votre annonce d'apparaître en tête de liste
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Ces services sont non remboursables une fois activés.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">8. Limitation de responsabilité</h2>
          <p className="text-muted-foreground leading-relaxed">
            SuguMali ne peut être tenu responsable des dommages résultant de transactions
            entre utilisateurs, de la perte de données, ou de l'utilisation abusive de la plateforme.
            Nous faisons notre possible pour assurer la sécurité de la plateforme mais ne pouvons
            garantir l'absence totale de fraude.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">9. Suspension et suppression de compte</h2>
          <p className="text-muted-foreground leading-relaxed">
            SuguMali se réserve le droit de suspendre ou supprimer tout compte qui viole
            ces conditions d'utilisation, sans préavis. Vous pouvez également supprimer
            votre compte à tout moment depuis les paramètres de votre profil.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">10. Modifications des conditions</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous nous réservons le droit de modifier ces conditions à tout moment.
            Les utilisateurs seront notifiés des changements importants par e-mail
            ou via une notification dans l'application. L'utilisation continue de
            SuguMali après modification vaut acceptation des nouvelles conditions.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">11. Droit applicable</h2>
          <p className="text-muted-foreground leading-relaxed">
            Ces conditions sont régies par la législation de la République du Mali.
            Tout litige sera soumis à la juridiction compétente de Bamako, Mali.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-black mb-3">12. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pour toute question relative à ces conditions d'utilisation :
          </p>
          <ul className="list-none text-muted-foreground space-y-1 mt-3">
            <li>📧 <a href="mailto:contact@sugumali.com" className="text-accent underline">contact@sugumali.com</a></li>
            <li>🌐 <a href="https://sugumali.com" className="text-accent underline">sugumali.com</a></li>
          </ul>
        </section>
  
        <div className="border-t border-border pt-8 mt-8">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} SuguMali. Tous droits réservés.
          </p>
        </div>
      </main>
    );
  }
