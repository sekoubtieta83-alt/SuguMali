
'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { type Post, posts as mockPosts } from '@/lib/data';
import { PostCard } from '@/components/dashboard/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function PromotionsPage() {
  const [promotedPosts, setPromotedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const annoncesRef = collection(firestore, 'annonces');
    // On retire l'orderBy pour éviter l'erreur d'index composite
    const q = query(
      annoncesRef, 
      where('isPromoted', '==', true),
      where('status', '==', 'approved')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsFromFirestore = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
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
            url: `/annonces/${doc.id}`,
          }
        } as Post;
      });

      // Tri côté client par date décroissante
      const sorted = [...postsFromFirestore].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setPromotedPosts(sorted);
      setIsLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: annoncesRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="font-semibold text-lg md:text-2xl">Produits promus</h1>
      </div>
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-4/5" />
                            <Skeleton className="h-7 w-3/5" />
                            <Skeleton className="h-4 w-2/5" />
                        </div>
                        <Skeleton className="h-10 w-full mt-auto" />
                    </div>
                </div>
            ))}
        </div>
      ) : promotedPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {promotedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Aucune promotion pour le moment</h3>
            <p className="text-sm text-muted-foreground">
              Les annonces avec l'option "Sponsorisé" apparaîtront ici.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
