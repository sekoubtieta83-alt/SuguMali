'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Fichier conservé uniquement pour la rétrocompatibilité.
 * Redirige vers la vue publique de l'annonce.
 */
export default function ProductRedirectPage() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/annonces/${id}`);
    }
  }, [id, router]);

  return null;
}
