
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PostCard } from '@/components/dashboard/post-card';
import { type Post } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Frown, ListFilter } from 'lucide-react';
import { FilterSidebar, type Filters } from '@/components/dashboard/filter-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DashboardPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    category: null,
    minPrice: '',
    maxPrice: '',
    conditions: [],
    location: '',
  });

  const lastLoggedSearch = useRef<string>('');

  // Initialisation des filtres à partir des paramètres d'URL
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

  // Requête vers Firestore simplifiée pour éviter le besoin d'index composite
  const annoncesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'annonces'), 
      where('status', '==', 'approved')
    );
  }, [firestore]);

  useEffect(() => {
    if (!annoncesQuery) return;

    const unsubscribe = onSnapshot(annoncesQuery, (snapshot) => {
      const postsFromFirestore = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.vendeurId,
          content: data.description || '',
          media: data.media ? data.media : (data.image ? [{ url: data.image, type: 'image' }] : []),
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

      setAllPosts(postsFromFirestore);
      setIsLoading(false);
    }, async (serverError) => {
      if (serverError.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: 'annonces',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      } else {
        console.error("Erreur Firestore dans DashboardPage:", serverError);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [annoncesQuery]);

  useEffect(() => {
    const filteredResults = allPosts.filter((post: Post) => {
        const { searchQuery, category, minPrice, maxPrice, conditions, location } = filters;

        const title = (post.product?.name || post.content).toLowerCase();
        const description = post.content.toLowerCase();
        const postLocation = (post.location || '').toLowerCase();
        const postCategory = post.category || '';
        const postCondition = post.condition || '';
        const postPrice = post.product?.price ? parseFloat(post.product.price.replace(/[^0-9]/g, '')) : 0;
        
        const queryText = searchQuery.toLowerCase();
        const locationText = location.toLowerCase();

        const matchesSearch = queryText ? (
            title.includes(queryText) ||
            description.includes(queryText) ||
            postLocation.includes(queryText)
        ) : true;

        const matchesLocation = locationText ? (
            postLocation.includes(locationText)
        ) : true;

        const matchesCategory = category ? postCategory === category : true;
        const matchesMinPrice = minPrice ? postPrice >= parseFloat(minPrice) : true;
        const matchesMaxPrice = maxPrice ? postPrice <= parseFloat(maxPrice) : true;
        const matchesCondition = conditions.length > 0 ? conditions.includes(postCondition) : true;
        
        return matchesSearch && matchesLocation && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesCondition;
    });

    // Tri combiné côté client : Sponsorisés d'abord, puis par date décroissante
    const finalResults = [...filteredResults].sort((a, b) => {
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;
        
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });

    setFilteredPosts(finalResults);

    // Logging des recherches uniquement si changement réel
    if (filters.searchQuery && filters.searchQuery !== lastLoggedSearch.current && firestore) {
        lastLoggedSearch.current = filters.searchQuery;
        const searchLogsRef = collection(firestore, 'searchLogs');
        const logData = {
            query: filters.searchQuery,
            resultsCount: finalResults.length,
            userId: user?.uid || 'anonymous',
            timestamp: serverTimestamp(),
        };
        addDoc(searchLogsRef, logData).catch(() => {});
    }

  }, [filters, allPosts, firestore, user]);

  const pageTitle = filters.searchQuery 
    ? `Résultats pour "${filters.searchQuery}"` 
    : (filters.location ? `Annonces à ${filters.location}` : "Toutes les annonces");

  return (
     <div className="flex flex-1">
        <div className="hidden lg:block lg:w-80 xl:w-96">
            <FilterSidebar filters={filters} setFilters={setFilters} />
        </div>
        <main className="flex-1 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-black text-xl md:text-3xl tracking-tight">{pageTitle}</h1>
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="rounded-xl border-2">
                                <ListFilter className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Filtres de recherche</SheetTitle>
                                <SheetDescription>Ajustez vos critères pour trouver l'annonce parfaite sur SuguMali.</SheetDescription>
                            </SheetHeader>
                            <FilterSidebar filters={filters} setFilters={setFilters} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            
             {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden flex flex-col p-4 space-y-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-5 w-4/5" />
                        <Skeleton className="h-7 w-3/5" />
                    </div>
                ))}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-3xl border-2 border-dashed py-32 mt-4 bg-muted/20">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground px-6">
                    <Frown className="h-12 w-12 opacity-50" />
                    <h3 className="text-2xl font-black text-foreground">Aucun résultat trouvé</h3>
                    <p className="text-sm max-w-xs">Nous n'avons rien trouvé correspondant à vos critères. Essayez de modifier les filtres de prix ou de lieu.</p>
                    <Button variant="link" className="text-accent font-bold mt-2" onClick={() => setFilters({
                        searchQuery: '',
                        category: null,
                        minPrice: '',
                        maxPrice: '',
                        conditions: [],
                        location: '',
                    })}>Réinitialiser tous les filtres</Button>
                </div>
                </div>
            )}
        </main>
    </div>
  );
}
