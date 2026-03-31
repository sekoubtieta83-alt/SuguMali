'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useFirestore, useUser } from '@/firebase/index';
import { collection, doc, onSnapshot, query, serverTimestamp, where, deleteDoc, updateDoc, increment, setDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReviewStars } from '@/components/dashboard/review-stars';
import { AddReviewForm } from '@/components/dashboard/add-review-form';
import { PromotionModal } from '@/components/dashboard/promotion-modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

const REPORT_REASONS = [
  "Arnaque / Fraude",
  "Produit interdit",
  "Contenu offensant",
  "Déjà vendu / Indisponible",
  "Catégorie incorrecte",
  "Autre"
];

interface AnnonceDetailViewProps {
  id: string;
}

export default function AnnonceDetailView({ id }: AnnonceDetailViewProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [post, setPost] = useState<Post | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);

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

  useEffect(() => {
    if (id && firestore) {
      const annonceRef = doc(firestore, 'annonces', id);
      updateDoc(annonceRef, { views: increment(1) }).catch(() => {});
    }
  }, [id, firestore]);

  useEffect(() => {
    if (id && user && firestore) {
      const favRef = doc(firestore, 'users', user.uid, 'favorites', id);
      const unsubscribe = onSnapshot(favRef, (snap) => {
        setIsFavorited(snap.exists());
      }, () => {
        setIsFavorited(false);
      });
      return () => unsubscribe();
    }
  }, [id, user, firestore]);

  useEffect(() => {
    if (!id || !firestore) return;

    setLoading(true);
    const annonceRef = doc(firestore, 'annonces', id);
    
    const unsubscribe = onSnapshot(annonceRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const base64Image = data.image || (data.media && data.media[0]?.url) || data.imageUrl || null;
        const media = data.media && data.media.length > 0 
          ? data.media 
          : (base64Image ? [{ url: base64Image, type: 'image' }] : []);

        const mappedPost: Post = {
          id: docSnap.id,
          vendeurId: data.vendeurId || '',
          content: data.description || '',
          media: media,
          image: base64Image,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          likes: 0,
          comments: 0,
          isProduct: true,
          isPromoted: data.isPromoted || false,
          isSold: data.status === 'sold' || data.isSold || false,
          location: data.localisation || 'Mali',
          whatsappNumber: data.whatsapp || '',
          category: data.categorie || 'Autre',
          condition: data.etat || 'Occasion',
          status: data.status || 'approved',
          views: data.views || 0,
          product: {
            name: data.titre || 'Sans titre',
            price: data.prix || '0 FCFA',
            url: `/annonces/${docSnap.id}`,
          }
        };
        setPost(mappedPost);
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching annonce:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, firestore]);

  useEffect(() => {
    if (!firestore || !post?.vendeurId) return;
    const userRef = doc(firestore, 'users', post.vendeurId);
    const unsubscribe = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
            const data = userSnap.data();
            setSeller({ 
              uid: userSnap.id, 
              displayName: data.displayName || data.username || 'Vendeur SuguMali', 
              email: data.email || '', 
              photoURL: data.photoURL || '', 
              isVerified: !!data.isVerified 
            });
        } else {
            setSeller({ uid: post.vendeurId, displayName: 'Vendeur SuguMali', email: '', photoURL: '', isVerified: false });
        }
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [firestore, post?.vendeurId]);

  useEffect(() => {
    if (!firestore || !seller?.uid) return;
    const reviewsRef = collection(firestore, 'reviews');
    const q = query(reviewsRef, where('sellerId', '==', seller.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        setReviews(fetchedReviews);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: reviewsRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    return () => unsubscribe();
  }, [firestore, seller?.uid]);

  const toggleFavorite = async () => {
    if (!user || !firestore || !id) {
      router.push('/login');
      return;
    }
    const favRef = doc(firestore, 'users', user.uid, 'favorites', id);
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

  const handleReport = async () => {
    if (!id || !user || !firestore || !reportReason) return;
    setIsReporting(true);
    try {
      await addDoc(collection(firestore, 'reports'), {
        annonceId: id,
        reason: reportReason,
        reporterId: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      toast({ title: "Signalement envoyé", description: "Merci de nous aider à garder SuguMali sûr." });
      setIsReportDialogOpen(false);
      setReportReason("");
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de l'envoi" });
    } finally {
      setIsReporting(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!id || !firestore) return;
    setIsMarkingSold(true);
    try {
      await updateDoc(doc(firestore, 'annonces', id), { status: 'sold' });
      toast({ title: 'Article marqué comme vendu' });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur" });
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !firestore) return;
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      await deleteDoc(doc(firestore, 'annonces', id));
      toast({ title: 'Annonce supprimée' });
      router.push('/dashboard');
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de la suppression" });
    }
  };

  const openLightbox = (url: string, type: 'image' | 'video') => {
    setSelectedMedia({ url, type });
    setIsLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-accent" />
        <p className="text-muted-foreground font-medium animate-pulse">Chargement de l'annonce...</p>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-6">
        <div className="bg-muted p-6 rounded-full">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black">Annonce non trouvée</h1>
          <p className="text-muted-foreground max-w-xs">Cette annonce a peut-être été supprimée ou n'existe plus.</p>
        </div>
        <Button onClick={() => router.push('/dashboard')} className="rounded-xl px-8 h-12 font-bold bg-accent">
          Retour aux annonces
        </Button>
      </div>
    );
  }

  const isOwner = user && user.uid === post.vendeurId;
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const whatsappMessage = encodeURIComponent(`Bonjour, je vous contacte depuis SuguMali à propos de votre annonce : ${post.product?.name}`);
  const whatsappLink = post.whatsappNumber ? `https://wa.me/${post.whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}` : '#';
  const telLink = post.whatsappNumber ? `tel:${post.whatsappNumber.replace(/\D/g, '')}` : '#';

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <div className="flex items-center justify-between p-4 bg-background border-b sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          {user && !isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical /></Button>
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
        <div className="px-6 py-4 flex items-center gap-2 text-xs font-medium text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-accent">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/dashboard" className="hover:text-accent">Annonces</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-accent cursor-pointer">{post.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[100px]">{post.product?.name}</span>
        </div>

        {post.status === 'sold' && (
          <div className="px-6 mb-4">
            <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-6 w-6" />
              <div className="flex flex-col">
                <p className="font-black text-sm uppercase tracking-wider">Cet article est VENDU</p>
                <p className="text-[10px] font-medium opacity-90">Il n'est plus disponible à l'achat.</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-background">
          <div className="max-w-xl mx-auto">
            {post.media && post.media.length > 0 ? (
              <>
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {post.media.map((media, index) => (
                      <CarouselItem key={index} className="relative aspect-[4/5] bg-muted cursor-zoom-in group" onClick={() => openLightbox(media.url, media.type)}>
                          {media.type === 'image' ? (
                              <Image 
                                src={media.url} 
                                alt={`${post.product?.name} - Photo ${index + 1}`}
                                fill 
                                className={cn("object-cover", post.status === 'sold' && "grayscale-[0.5] opacity-80")} 
                                unoptimized={media.url.startsWith('data:')}
                              />
                          ) : (
                              <div className="relative w-full h-full">
                                  <video src={media.url} className={cn("w-full h-full object-cover", post.status === 'sold' && "grayscale-[0.5] opacity-80")} muted loop autoPlay playsInline />
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
                {post.media.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {post.media.map((_, i) => (
                      <div key={i} className={cn("h-2 w-2 rounded-full transition-all duration-300", current === i ? "bg-[#FF8C00] w-4" : "bg-muted-foreground/30")}/>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-black">{post.product?.name}</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {post.location}
              </p>
            </div>
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", post.status === 'sold' ? "bg-muted text-muted-foreground" : "bg-accent/20 text-accent")}>
              {post.condition}
            </span>
          </div>

          <div className={cn("text-3xl font-black", post.status === 'sold' ? "text-muted-foreground line-through" : "text-accent")}>{post.product?.price}</div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Description</h3>
            <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
          
          {seller && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-border/50">
              <Link href={`/profile/${seller.uid}`} className="flex items-center gap-3 flex-1 group">
                <Avatar className="h-12 w-12 group-hover:ring-2 ring-accent transition-all">
                  <AvatarImage src={seller.photoURL} />
                  <AvatarFallback>{seller.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold group-hover:text-accent transition-colors">{seller.displayName}</p>
                    {seller.isVerified && <BadgeCheck className="h-5 w-5 fill-accent text-white" />}
                  </div>
                  <ReviewStars rating={averageRating} size={14} />
                </div>
              </Link>
              {!isOwner && user && (
                  <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-xl font-bold">Laisser un avis</Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Évaluer le vendeur</DialogTitle>
                              <DialogDescription>Partagez votre expérience avec {seller.displayName}.</DialogDescription>
                          </DialogHeader>
                          <AddReviewForm sellerId={seller.uid} annonceId={id} onFinished={() => setIsReviewDialogOpen(false)} />
                      </DialogContent>
                  </Dialog>
              )}
            </div>
          )}

          {isOwner && (
            <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-4">
              <h3 className="font-bold flex items-center gap-2"><Rocket className="h-5 w-5"/> Zone Vendeur</h3>
              <div className="grid grid-cols-1 gap-2">
                {post.status !== 'sold' && (
                  <>
                    {!post.isPromoted && (
                        <Button className="w-full bg-accent text-white font-bold h-12 rounded-xl" onClick={() => setIsPromotionModalOpen(true)}>Promouvoir l'annonce</Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full font-bold h-12 rounded-xl border-2 text-green-600 border-green-200 hover:bg-green-50" 
                      onClick={handleMarkAsSold}
                      disabled={isMarkingSold}
                    >
                      {isMarkingSold ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Marquer comme vendu
                    </Button>
                  </>
                )}
                <Button variant="destructive" className="w-full font-bold h-12 rounded-xl" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Supprimer l'annonce</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PromotionModal isOpen={isPromotionModalOpen} onOpenChange={setIsPromotionModalOpen} annonceId={id} annonceTitle={post.product?.name || 'Sans titre'} />

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Signaler l'annonce</DialogTitle>
            <DialogDescription>Pourquoi souhaitez-vous signaler cette annonce ?</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={reportReason} onValueChange={setReportReason} className="gap-3">
              {REPORT_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="flex-1 cursor-pointer font-medium text-sm">{reason}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleReport} disabled={!reportReason || isReporting} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold px-6">
              {isReporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Flag className="h-4 w-4 mr-2" />}Envoyer le signalement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {post.status !== 'sold' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 pb-6 flex items-center gap-2 z-40 max-w-2xl mx-auto shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
          <Button variant="outline" size="icon" className={cn("rounded-full h-14 w-14 shrink-0 shadow-lg border-2", isFavorited ? "text-[#e91e63] border-[#e91e63]/20 fill-[#e91e63]" : "text-muted-foreground")} onClick={toggleFavorite}>
            <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
          </Button>
          <div className="flex-1 flex gap-2 h-14">
            <a href={telLink} className="flex-1 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-base transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"><Phone size={20} />Appel</a>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-base transition-all active:scale-[0.98] shadow-lg shadow-green-500/20"><MessageCircle size={20} />WhatsApp</a>
          </div>
        </div>
      )}

      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-none bg-black/90 flex items-center justify-center overflow-hidden" hideCloseButton>
            <button onClick={() => setIsLightboxOpen(false)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"><X className="h-6 w-6" /></button>
            <div className="relative w-full h-full flex items-center justify-center">
                {selectedMedia?.type === 'image' ? (
                    <img src={selectedMedia.url} alt="Zoom image" className="max-w-full max-h-full object-contain"/>
                ) : <video src={selectedMedia?.url} className="max-w-full max-h-full" controls autoPlay />}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
