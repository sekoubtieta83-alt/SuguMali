
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { type Post } from '@/lib/data';
import {
  MessageCircle,
  Phone,
  MapPin,
  ArrowLeft,
  X,
  Rocket,
  Trash2,
  Flag,
  Loader2,
  Heart,
  Maximize2,
  BadgeCheck,
  MoreVertical,
  ShieldAlert,
  Play,
  Star,
  ChevronRight,
  MessageSquareText
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, where, deleteDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReviewStars } from '@/components/dashboard/review-stars';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AddReviewForm } from '@/components/dashboard/add-review-form';
import Link from 'next/link';

type Seller = {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    isVerified: boolean;
};

type Review = {
    id: string;
    rating: number;
    comment: string;
    createdAt: any;
    sellerId: string;
};

export default function AnnoncePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [post, setPost] = useState<Post | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  
  // Carousel API
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  // Sync active index
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  // Increment views
  useEffect(() => {
    if (id && firestore) {
      const annonceRef = doc(firestore, 'annonces', id as string);
      updateDoc(annonceRef, { views: increment(1) }).catch(() => {});
    }
  }, [id, firestore]);

  // Check if favorited
  useEffect(() => {
    if (id && user && firestore) {
      const favRef = doc(firestore, 'users', user.uid, 'favorites', id as string);
      const unsubscribe = onSnapshot(favRef, (snap) => {
        setIsFavorited(snap.exists());
      });
      return () => unsubscribe();
    }
  }, [id, user, firestore]);

  useEffect(() => {
    if (id && firestore) {
      const annonceRef = doc(firestore, 'annonces', id as string);
      const unsubscribe = onSnapshot(annonceRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mappedPost: Post = {
            id: docSnap.id,
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
            manualReviewRequested: data.manualReviewRequested || false,
            moderationReason: data.moderationReason || '',
            product: {
              name: data.titre || 'Sans titre',
              price: data.prix || '0 FCFA',
              url: `/annonces/${docSnap.id}`,
            }
          };
          setPost(mappedPost);

          if (!seller || seller.uid !== data.vendeurId) {
            const userRef = doc(firestore, 'users', data.vendeurId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setSeller(userSnap.data() as Seller);
            } else {
              setSeller({ uid: data.vendeurId, displayName: 'Vendeur', email: '', photoURL: '', isVerified: false });
            }
          }
        } else {
          setPost(null);
        }
        setLoading(false);
      }, (error) => {
        console.error(error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else if (!firestore) {
        setLoading(false);
    }
  }, [id, firestore, seller?.uid]);

  useEffect(() => {
    if (!firestore || !seller?.uid) return;
    const reviewsRef = collection(firestore, 'reviews');
    const q = query(reviewsRef, where('sellerId', '==', seller.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [firestore, seller?.uid]);

  const toggleFavorite = async () => {
    if (!user || !firestore || !id) {
      router.push('/login');
      return;
    }
    const favRef = doc(firestore, 'users', user.uid, 'favorites', id as string);
    if (isFavorited) {
      await deleteDoc(favRef);
      toast({ title: 'Retiré des favoris' });
    } else {
      await setDoc(favRef, { 
        annonceId: id,
        createdAt: serverTimestamp() 
      });
      toast({ title: 'Ajouté aux favoris' });
    }
  };

  const handleRequestManualReview = () => {
    if (!post || !id || !user || !firestore) return;
    setIsRequestingReview(true);
    const docRef = doc(firestore, 'annonces', id as string);
    updateDoc(docRef, { manualReviewRequested: true })
      .then(() => {
        toast({ title: 'Demande envoyée' });
      })
      .finally(() => setIsRequestingReview(false));
  };

  const handlePromote = () => {
    if (!post || !id || !user || !firestore) return;
    const docRef = doc(firestore, 'annonces', id as string);
    updateDoc(docRef, { isPromoted: true })
        .then(() => {
            toast({ title: 'Article promu !' });
        });
  };

  const handleDelete = () => {
    if (!post || !id || !firestore) return;
    const docRef = doc(firestore, 'annonces', id as string);
    deleteDoc(docRef)
        .then(() => {
            toast({ title: 'Annonce supprimée' });
            router.push('/dashboard');
        });
  };

  const openLightbox = (url: string, type: 'image' | 'video') => {
    setSelectedMedia({ url, type });
    setIsLightboxOpen(true);
  };

  if (loading) {
    return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-accent" /></div>;
  }
  
  if (!post || !seller) {
    return <div className="p-20 text-center"><h1 className="text-2xl font-bold">Annonce non trouvée</h1><Button onClick={() => router.push('/')} className="mt-4">Retour</Button></div>;
  }

  const isOwner = user && user.uid === post.userId;
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  // WhatsApp automatic message
  const whatsappMessage = encodeURIComponent(`Bonjour, je vous contacte depuis SuguMali à propos de votre annonce : ${post.product?.name}`);
  const whatsappLink = post.whatsappNumber ? `https://wa.me/${post.whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}` : '#';
  const telLink = post.whatsappNumber ? `tel:${post.whatsappNumber.replace(/\D/g, '')}` : '#';
  const smsLink = post.whatsappNumber ? `sms:${post.whatsappNumber.replace(/\D/g, '')}?body=${whatsappMessage}` : '#';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between p-4 bg-background border-b sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          {user && !isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsReportDialogOpen(true)}>
                  <Flag className="mr-2 h-4 w-4" />Signaler
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Breadcrumbs */}
        <div className="px-6 py-4 flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-accent">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard" className="hover:text-accent">Annonces</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-accent cursor-pointer">{post.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[100px]">{post.product?.name}</span>
        </div>

        {isOwner && post.status !== 'approved' && (
            <div className="px-6 mb-4">
                {post.status === 'rejected' ? (
                    <Alert variant="destructive"><ShieldAlert /><AlertTitle>Rejetée</AlertTitle><AlertDescription>{post.moderationReason}<br/><Button size="sm" variant="outline" onClick={handleRequestManualReview} disabled={isRequestingReview || post.manualReviewRequested}>{post.manualReviewRequested ? 'Demande envoyée' : 'Analyse manuelle'}</Button></AlertDescription></Alert>
                ) : <Alert><Loader2 className="animate-spin" /><AlertTitle>Validation...</AlertTitle><AlertDescription>En cours d'analyse automatique.</AlertDescription></Alert>}
            </div>
        )}

        {/* Media Section */}
        <div className="bg-background">
          <div className="max-w-xl mx-auto">
            {post.media && post.media.length > 0 ? (
              <>
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {post.media.map((media, index) => (
                      <CarouselItem key={index} className="relative aspect-[4/5] bg-muted cursor-zoom-in group" onClick={() => openLightbox(media.url, media.type)}>
                          {media.type === 'image' ? (
                              <Image src={media.url} alt="" fill className="object-cover" />
                          ) : (
                              <div className="relative w-full h-full">
                                  <video src={media.url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="h-12 w-12 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" />
                          </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {/* Progress Dots */}
                {post.media.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {post.media.map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-2 w-2 rounded-full transition-all duration-300",
                          current === i ? "bg-[#b71c1c] w-4" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Thumbnails Row */}
                {post.media.length > 1 && (
                  <div className="flex items-center gap-3 px-6 mt-4 overflow-x-auto scrollbar-hide pb-2">
                    {post.media.map((m, i) => (
                      <button 
                        key={i} 
                        onClick={() => scrollTo(i)}
                        className={cn(
                          "relative h-20 aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0",
                          current === i ? "border-[#b71c1c] scale-105" : "border-transparent opacity-60"
                        )}
                      >
                        {m.type === 'image' ? (
                          <img src={m.url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="relative w-full h-full">
                            <video src={m.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play size={12} className="text-white fill-current" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : <div className="w-full aspect-[4/5] bg-muted" />}
          </div>
        </div>
        
        {/* Content Details */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-black">{post.product?.name}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {post.location}
              </p>
            </div>
            <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase">
              {post.condition}
            </span>
          </div>

          <div className="text-3xl font-black text-accent">{post.product?.price}</div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Description</h3>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
          
          {/* Seller Card */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border/50">
             <Avatar className="h-12 w-12"><AvatarImage src={seller.photoURL} /><AvatarFallback>{seller.displayName.charAt(0)}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold">{seller.displayName}</p>
                {seller.isVerified && <BadgeCheck className="h-5 w-5 fill-accent text-white" />}
              </div>
              <ReviewStars rating={averageRating} size={14} />
            </div>
            {!isOwner && user && (
                <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold">
                            Laisser un avis
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Évaluer le vendeur</DialogTitle>
                            <DialogDescription>Partagez votre expérience avec {seller.displayName}.</DialogDescription>
                        </DialogHeader>
                        <AddReviewForm sellerId={seller.uid} annonceId={post.id} onFinished={() => setIsReviewDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            )}
          </div>

          {isOwner && (
            <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Rocket className="h-5 w-5"/> Zone Vendeur</h3>
              <div className="grid grid-cols-1 gap-2">
                {!post.isPromoted && <Button className="w-full bg-accent text-white font-bold" onClick={handlePromote}>Promouvoir l'annonce</Button>}
                <Button variant="destructive" className="w-full font-bold" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Supprimer</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar (Sticky Footer) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 pb-6 flex items-center gap-2 z-40 max-w-2xl mx-auto shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
        {/* Favorite Button Overlaying slightly */}
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "rounded-full h-14 w-14 shrink-0 shadow-lg border-2",
            isFavorited ? "text-[#e91e63] border-[#e91e63]/20 fill-[#e91e63]" : "text-muted-foreground"
          )}
          onClick={toggleFavorite}
        >
          <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
        </Button>

        {/* Action Buttons */}
        <div className="flex-1 flex gap-2 h-14">
          <a 
            href={telLink} 
            className="flex-1 bg-[#e91e63] hover:bg-[#d81b60] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-[#e91e63]/20"
          >
            <Phone size={18} />
            Appel
          </a>
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
          <a 
            href={smsLink} 
            className="flex-1 bg-[#f9a825] hover:bg-[#f57f17] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-[#f9a825]/20"
          >
            <MessageSquareText size={18} />
            SMS
          </a>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-none bg-black/90 flex items-center justify-center overflow-hidden" hideCloseButton>
            <DialogHeader className="sr-only">
              <DialogTitle>Média de l'annonce</DialogTitle>
              <DialogDescription>Vue agrandie de l'image ou de la vidéo de l'annonce sélectionnée.</DialogDescription>
            </DialogHeader>
            <button 
                onClick={() => setIsLightboxOpen(false)} 
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Fermer la vue agrandie"
            >
                <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
                {selectedMedia?.type === 'image' ? (
                    <img 
                        src={selectedMedia.url} 
                        alt="Zoom image" 
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <video 
                        src={selectedMedia?.url} 
                        className="max-w-full max-h-full" 
                        controls 
                        autoPlay 
                    />
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
