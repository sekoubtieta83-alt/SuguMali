
'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { PostCard } from '@/components/dashboard/post-card';
import { type Post } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Frown, ListFilter, Sparkles } from 'lucide-react';
import { FilterSidebar, type Filters } from '@/components/dashboard/filter-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function DashboardInner() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  // Requête vers Firestore
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
          vendeurVerified: data.vendeurVerified || false,
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
        } as Post & { vendeurVerified: boolean };
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

    const finalResults = [...filteredResults].sort((a: any, b: any) => {
        // 1. Promus
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;

        // 2. Vérifiés
        if (a.vendeurVerified && !b.vendeurVerified) return -1;
        if (!a.vendeurVerified && b.vendeurVerified) return 1;

        // 3. Date
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    setFilteredPosts(finalResults);

    if (filters.searchQuery && filters.searchQuery !== lastLoggedSearch.current && firestore) {
        lastLoggedSearch.current = filters.searchQuery;
        const searchLogsRef = collection(firestore, 'searchLogs');
        addDoc(searchLogsRef, {
            query: filters.searchQuery,
            resultsCount: finalResults.length,
            userId: user?.uid || 'anonymous',
            timestamp: serverTimestamp(),
        }).catch(() => {});
    }

  }, [filters, allPosts, firestore, user]);

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
                    <p className="text-muted-foreground font-medium text-sm md:text-base">
                        {isLoading ? "Chargement des pépites..." : `${filteredPosts.length} annonce${filteredPosts.length > 1 ? 's' : ''} trouvée${filteredPosts.length > 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="lg:hidden flex justify-end">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="rounded-2xl border-2 font-bold px-6 h-12 flex items-center gap-2 bg-background shadow-sm hover:bg-accent hover:text-white transition-all">
                                <ListFilter className="h-5 w-5" />
                                Filtrer
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-full sm:w-80 border-none">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Filtres</SheetTitle>
                                <SheetDescription>Ajustez vos critères.</SheetDescription>
                            </SheetHeader>
                            <FilterSidebar 
                                filters={filters} 
                                setFilters={setFilters} 
                                onApply={() => setIsSheetOpen(false)} 
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            
             {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden flex flex-col p-4 space-y-4">
                        <Skeleton className="h-56 w-full rounded-2xl" />
                        <Skeleton className="h-6 w-4/5 rounded-full" />
                        <Skeleton className="h-8 w-3/5 rounded-full" />
                    </div>
                ))}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-[3rem] border-2 border-dashed border-border py-32 mt-4 bg-muted/10">
                <div className="flex flex-col items-center gap-4 text-center text-muted-foreground px-6">
                    <div className="bg-muted p-6 rounded-full">
                        <Frown className="h-16 w-16 opacity-20" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-foreground">Oups ! Rien ici</h3>
                        <p className="text-base max-w-sm font-medium">Nous n'avons rien trouvé. Essayez d'autres critères ou réinitialisez les filtres.</p>
                    </div>
                    <Button 
                        variant="default" 
                        className="bg-accent hover:bg-accent/90 text-white font-black px-8 h-12 rounded-2xl mt-4 shadow-xl shadow-accent/20" 
                        onClick={() => setFilters({
                            searchQuery: '',
                            category: null,
                            minPrice: '',
                            maxPrice: '',
                            conditions: [],
                            location: '',
                        })}
                    >
                        Réinitialiser les filtres
                    </Button>
                </div>
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
