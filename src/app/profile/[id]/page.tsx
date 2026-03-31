'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Calendar, ArrowLeft, Loader2, Package, ShoppingBag } from 'lucide-react';
import { PostCard } from '@/components/dashboard/post-card';
import { type Post } from '@/lib/data';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ReviewStars } from '@/components/dashboard/review-stars';

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  
  const [seller, setSeller] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !firestore) return;

    const userRef = doc(firestore, 'users', id as string);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setSeller(snap.data());
      } else {
        setSeller(null);
      }
    });

    const postsRef = collection(firestore, 'annonces');
    const q = query(
      postsRef,
      where('vendeurId', '==', id),
      where('status', '==', 'approved')
    );

    const unsubPosts = onSnapshot(q, (snap) => {
      const fetchedPosts = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          vendeurId: data.vendeurId,
          titre: data.titre,
          prix: data.prix,
          localisation: data.localisation,
          categorie: data.categorie,
          etat: data.etat,
          description: data.description || '',
          image: data.image || (data.media && data.media[0]?.url) || null,
          media: data.media || [],
          status: data.status || 'approved',
          createdAt: data.createdAt,
          isPromoted: !!data.isPromoted,
          isSold: data.status === 'sold',
          product: {
            name: data.titre || 'Sans titre',
            price: data.prix || '0 FCFA',
            url: `/annonces/${doc.id}`,
          }
        } as unknown as Post;
      });
      
      const sorted = [...fetchedPosts].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      
      setPosts(sorted);
      setLoading(false);
    });

    const reviewsRef = collection(firestore, 'reviews');
    const qRev = query(reviewsRef, where('sellerId', '==', id));
    const unsubReviews = onSnapshot(qRev, (snap) => {
        setReviews(snap.docs.map(d => d.data()));
    });

    return () => {
      unsubUser();
      unsubPosts();
      unsubReviews();
    };
  }, [id, firestore]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Chargement du profil...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-black">Utilisateur introuvable</h1>
        <p className="text-muted-foreground">Ce compte n'existe pas ou a été supprimé.</p>
        <Button onClick={() => router.push('/')} className="rounded-xl font-bold bg-accent">Retour à l'accueil</Button>
      </div>
    );
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const joinedDate = seller.createdAt?.toDate ? seller.createdAt.toDate() : new Date();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b p-4 sticky top-0 z-30 flex items-center justify-between gap-4 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-black tracking-tight truncate max-w-[200px]">{seller.displayName}</h1>
        </div>
        {seller.isVerified && (
            <div className="bg-accent/10 text-accent px-2 py-1 rounded-full border border-accent/20" title="Vendeur Certifié">
                <BadgeCheck className="h-4 w-4 fill-accent text-white" />
            </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-card rounded-[2.5rem] border shadow-sm p-6 md:p-10 mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShoppingBag className="h-32 w-32 rotate-12" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-1 ring-border">
              <AvatarImage src={seller.photoURL} alt={seller.displayName} className="object-cover" />
              <AvatarFallback className="text-4xl font-black bg-accent text-white">{seller.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{seller.displayName}</h2>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-muted-foreground text-sm font-semibold">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Membre depuis {format(joinedDate, 'MMMM yyyy', { locale: fr })}</div>
                    <div className="flex items-center gap-2"><Package className="h-4 w-4 text-accent" /> {posts.length} annonce{posts.length > 1 ? 's' : ''} active{posts.length > 1 ? 's' : ''}</div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-start gap-2 bg-muted/30 p-4 rounded-2xl border border-border/50 w-fit mx-auto md:ml-0">
                <div className="flex items-center gap-2">
                    <ReviewStars rating={averageRating} size={18} />
                    <span className="text-lg font-black">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</span>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{reviews.length} avis clients</p>
              </div>

              {seller.bio && (
                <div className="relative">
                    <p className="text-base text-foreground/80 max-w-2xl leading-relaxed italic">
                        "{seller.bio}"
                    </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Package className="h-7 w-7 text-accent" />
                Sa Boutique SuguMali
            </h3>
            <span className="bg-accent text-white px-4 py-1 rounded-full text-xs font-black">{posts.length} articles</span>
          </div>
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50 text-center space-y-4">
              <Package className="h-16 w-16 text-muted-foreground/20" />
              <div className="space-y-1">
                <p className="text-xl font-black text-muted-foreground">Boutique vide pour l'instant</p>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">Ce vendeur n'a aucune annonce approuvée en ligne actuellement.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
