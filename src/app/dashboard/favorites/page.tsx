
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { type Post } from '@/lib/data';
import { PostCard } from '@/components/dashboard/post-card';
import { Heart, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
      if (!user) setLoading(false);
      return;
    }

    const favsRef = collection(firestore, 'users', user.uid, 'favorites');
    const unsubscribe = onSnapshot(favsRef, async (snapshot) => {
      const annonceIds = snapshot.docs.map(d => d.id);
      
      if (annonceIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Fetch each ad details
      const fetchedAnnonces = await Promise.all(
        annonceIds.map(async (id) => {
          const adRef = doc(firestore, 'annonces', id);
          const adSnap = await getDoc(adRef);
          if (adSnap.exists()) {
            const data = adSnap.data();
            return {
              id: adSnap.id,
              userId: data.vendeurId,
              content: data.description || '',
              media: data.image ? [{ url: data.image, type: 'image' }] : [],
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              likes: 0,
              comments: 0,
              isProduct: true,
              isPromoted: data.isPromoted || false,
              location: data.localisation || '',
              whatsappNumber: data.whatsapp || '',
              category: data.categorie || '',
              condition: data.etat || 'Occasion',
              status: data.status || 'approved',
              views: data.views || 0,
              product: {
                name: data.titre || 'Sans titre',
                price: data.prix || '0 FCFA',
                url: `/annonces/${adSnap.id}`,
              }
            } as Post;
          }
          return null;
        })
      );

      setFavorites(fetchedAnnonces.filter(a => a !== null && a.status === 'approved') as Post[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        <h1 className="font-semibold text-lg md:text-2xl">Mes Favoris</h1>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col p-4 space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-7 w-3/5" />
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-20 mt-8 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">Aucun favori</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
            Les annonces que vous marquez d'un cœur apparaîtront ici pour les retrouver facilement.
          </p>
        </div>
      )}
    </div>
  );
}
