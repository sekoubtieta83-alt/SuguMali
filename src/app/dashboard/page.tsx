'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { PostCard } from '@/components/dashboard/post-card';
import { type Post } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Frown, Sparkles, Star } from 'lucide-react';
import { FilterSidebar, type Filters } from '@/components/dashboard/filter-sidebar';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, limit, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function DashboardInner() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    category: null,
    minPrice: '',
    maxPrice: '',
    conditions: [],
    location: '',
  });

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || null;
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const conditionsStr = searchParams.get('conditions') || '';
    const location = searchParams.get('location') || '';
    const conditions = conditionsStr ? conditionsStr.split(',') : [];

    setFilters({
      searchQuery: search,
      category,
      minPrice,
      maxPrice,
      conditions,
      location,
    });
  }, [searchParams]);

  const annoncesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'annonces'), 
      where('status', '==', 'approved'),
      limit(100) // Augmenté pour montrer plus d'annonces incluant les non-certifiées
    );
  }, [firestore]);

  useEffect(() => {
    if (!annoncesQuery) return;

    const unsubscribe = onSnapshot(annoncesQuery, { includeMetadataChanges: true }, (snapshot) => {
      const postsFromFirestore = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        const postImage = data.image || (data.media && data.media[0]?.url) || null;

        return {
          id: doc.id,
          vendeurId: data.vendeurId || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          titre: data.titre || 'Sans titre',
          description: data.description || '',
          categorie: data.categorie || 'Autre',
          etat: data.etat || 'Occasion',
          prix: data.prix || 0,
          localisation: data.localisation || 'Mali',
          vendeurVerified: Boolean(data.vendeurVerified || data.isVerified),
          status: data.status || 'approved',
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
          isPromoted: Boolean(data.isPromoted),
          sponsored: Boolean(data.sponsored),
          isSold: data.status === 'sold',
          image: postImage,
          media: data.media || (postImage ? [{ url: postImage, type: 'image' }] : []),
          product: {
            name: data.titre || 'Sans titre',
            price: data.prix || '0 FCFA',
            url: `/annonces/${doc.id}`,
          }
        } as Post;
      });

      setAllPosts(postsFromFirestore);
      setIsLoading(false);
    }, (serverError) => {
      if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'annonces',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [annoncesQuery]);

  useEffect(() => {
    const filteredResults = allPosts.filter((post: Post) => {
        const { searchQuery, category, minPrice, maxPrice, conditions, location } = filters;

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            (post.titre || '').toLowerCase().includes(searchLower) || 
            (post.description || '').toLowerCase().includes(searchLower);

        const matchesCategory = !category || post.categorie === category;
        
        const currentPrice = typeof post.prix === 'number' ? post.prix : parseFloat(String(post.prix).replace(/[^0-9]/g, '')) || 0;
        const matchesMinPrice = !minPrice || currentPrice >= parseFloat(minPrice);
        const matchesMaxPrice = !maxPrice || currentPrice <= parseFloat(maxPrice);
        
        const matchesCondition = conditions.length === 0 || conditions.includes(post.etat);
        const matchesLocation = !location || (post.localisation || '').toLowerCase().includes(location.toLowerCase());

        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition && matchesLocation;
    });

    // --- LOGIQUE DE TRI HIÉRARCHIQUE : BOOSTÉS > CERTIFIÉS > RESTE ---
    const finalResults = [...filteredResults].sort((a, b) => {
        // Priorité 1: Sponsorisé ou Promu
        const priorityA = (a.sponsored || a.isPromoted) ? 1 : 0;
        const priorityB = (b.sponsored || b.isPromoted) ? 1 : 0;
        if (priorityA !== priorityB) return priorityB - priorityA;

        // Priorité 2: Vendeur Certifié
        const certA = a.vendeurVerified ? 1 : 0;
        const certB = b.vendeurVerified ? 1 : 0;
        if (certA !== certB) return certB - certA;

        // Priorité 3: Date de création (décroissante) pour tout le reste
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
    });

    setFilteredPosts(finalResults);
  }, [filters, allPosts]);

  const pageTitle = filters.searchQuery 
    ? `Résultats pour "${filters.searchQuery}"` 
    : (filters.location ? `Annonces à ${filters.location}` : "Explorer SuguMali");

  return (
    <div className="flex flex-1 bg-secondary/5">
        <div className="hidden lg:block lg:w-80 xl:w-96 sticky top-20 h-[calc(100vh-5rem)] border-r bg-background">
            <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>
        <main className="flex-1 p-4 md:p-8 lg:p-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div className="space-y-1">
                    <h1 className="font-black text-2xl md:text-4xl tracking-tight text-foreground flex items-center gap-3">
                        {pageTitle}
                        {!filters.searchQuery && !filters.location && <Sparkles className="h-6 w-6 text-accent animate-pulse" />}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        Priorité aux vendeurs certifiés et annonces boostées
                    </div>
                    <p className="text-muted-foreground font-medium text-sm md:text-base mt-2">
                        {isLoading ? "Chargement..." : `${filteredPosts.length} annonce(s) trouvée(s)`}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-3xl" />)}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-[2rem] border-2 border-dashed">
                    <Frown className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-muted-foreground">Aucune annonce trouvée</h3>
                    <p className="text-sm text-muted-foreground/60 mt-1">Essayez de modifier vos filtres de recherche.</p>
                </div>
            )}
        </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Skeleton className="h-12 w-12 mx-auto rounded-full" /></div>}>
      <DashboardInner />
    </Suspense>
  );
}
