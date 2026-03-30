'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, onSnapshot, doc, DocumentReference } from 'firebase/firestore';
import { type Post } from '@/lib/data';
import { PostCard } from '@/components/dashboard/post-card';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    
    // On écoute la liste des IDs en favoris
    const unsubscribeFavs = onSnapshot(favsRef, (snapshot) => {
      const annonceIds = snapshot.docs.map(d => d.id);
      
      if (annonceIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Pour chaque ID, on crée un écouteur temps réel sur l'annonce elle-même
      const adsData: { [key: string]: Post } = {};
      const adUnsubscribes: (() => void)[] = [];

      annonceIds.forEach(id => {
        const adRef = doc(firestore, 'annonces', id);
        const unsubAd = onSnapshot(adRef, (adSnap) => {
          if (adSnap.exists()) {
            const data = adSnap.data();
            const post: Post = {
              id: adSnap.id,
              userId: data.vendeurId,
              content: data.description || '',
              media: data.media ? data.media : (data.image ? [{ url: data.image, type: 'image' }] : []),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              likes: 0,
              comments: 0,
              isProduct: true,
              isPromoted: data.isPromoted || false,
              isSold: data.isSold || false,
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
            };
            
            if (post.status === 'approved') {
                adsData[id] = post;
            } else {
                delete adsData[id];
            }
          } else {
            delete adsData[id];
          }
          
          // Mise à jour de l'état avec les données collectées
          setFavorites(Object.values(adsData).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        }, (err) => {
            console.error("Error listening to ad:", id, err);
        });
        adUnsubscribes.push(unsubAd);
      });

      return () => {
        adUnsubscribes.forEach(unsub => unsub());
      };
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: favsRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribeFavs();
  }, [user, firestore]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-red-500 fill-red-500" />
        <h1 className="font-black text-xl md:text-3xl tracking-tight">Mes Favoris</h1>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden flex flex-col p-4 space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-5 w-4/5 rounded-full" />
              <Skeleton className="h-7 w-3/5 rounded-full" />
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed py-24 mt-8 text-center bg-muted/5">
          <Heart className="h-16 w-16 text-muted-foreground/20 mb-6" />
          <h3 className="text-2xl font-black">C'est bien vide ici...</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 font-medium">
            Les annonces que vous marquez d'un cœur apparaîtront ici. Commencez à explorer pour trouver des pépites !
          </p>
        </div>
      )}
    </div>
  );
}
