import { Metadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import AnnonceDetailView from '@/components/annonces/annonce-detail-view';

// Initialisation de Firebase côté serveur pour la récupération des métadonnées
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function getAnnonce(id: string) {
  try {
    const docRef = doc(db, 'annonces', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error("SEO Fetch Error:", e);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ad: any = await getAnnonce(id);

  if (!ad) {
    return {
      title: 'Annonce non trouvée | SuguMali',
      description: 'Cette annonce a été supprimée ou n\'existe plus sur SuguMali.',
    };
  }

  const titre = ad.titre || 'Produit sans titre';
  const localisation = ad.localisation || 'Mali';
  const price = ad.prix || 'Prix sur demande';
  const description = (ad.description || '').substring(0, 160);
  const imageUrl = ad.image || (ad.media && ad.media[0]?.url) || '';

  const fullTitle = `${titre} à ${localisation} | SuguMali`;

  return {
    title: fullTitle,
    description: description,
    openGraph: {
      title: `${titre} - ${price}`,
      description: `${description} | Situé à ${localisation}`,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 600, alt: titre }] : [],
      type: 'article',
      siteName: 'SuguMali',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad: any = await getAnnonce(id);

  // Script de données structurées pour Google (Rich Snippets)
  const jsonLd = ad ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": ad.titre,
    "image": ad.image || (ad.media && ad.media[0]?.url),
    "description": ad.description,
    "brand": {
      "@type": "Brand",
      "name": "SuguMali"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://sugumali.com/annonces/${id}`,
      "priceCurrency": "XOF",
      "price": (ad.prix || "").toString().replace(/[^0-9]/g, ""),
      "itemCondition": ad.etat === "Neuf" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": "Vendeur Certifié SuguMali"
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AnnonceDetailView id={id} />
    </>
  );
}
