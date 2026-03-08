
'use client';

import { useState, useEffect } from 'react';
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
  Ban,
  BadgeCheck,
  Star,
  MoreVertical,
  Flag,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Send,
  HelpCircle,
  Heart,
  Maximize2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, where, deleteDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { type Review, ReviewCard } from '@/components/dashboard/review-card';
import { ReviewStars } from '@/components/dashboard/review-stars';
import { AddReviewForm } from '@/components/dashboard/add-review-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { logActivity } from '@/lib/audit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

type Seller = {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    isVerified: boolean;
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
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isRequestingReview, setIsRequestingReview] = useState(false);
  
  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

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
        fetchedReviews.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt?.seconds ?? 0) * 1000;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt?.seconds ?? 0) * 1000;
            return dateB - dateA;
        });
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

  const handleReportSubmit = async () => {
    if (!user || !firestore || !id || !post) return;
    setIsSubmittingReport(true);
    const reportData = {
      reporterId: user.uid,
      annonceId: id as string,
      reason: reportReason,
      comment: reportComment,
      createdAt: serverTimestamp(),
    };
    addDoc(collection(firestore, 'reports'), reportData).then(() => {
        toast({ title: 'Annonce signalée' });
        setIsReportDialogOpen(false);
    }).finally(() => setIsSubmittingReport(false));
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

  const openLightbox = (url: string) => {
    setSelectedImageUrl(url);
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

  const whatsappLink = post.whatsappNumber ? `https://wa.me/${post.whatsappNumber.replace(/\D/g, '')}` : '#';
  const telLink = post.whatsappNumber ? `tel:${post.whatsappNumber.replace(/\D/g, '')}` : '#';

  return (
    <div className="flex flex-col flex-1 bg-background h-screen">
      <div className="flex items-center justify-between p-4 bg-background border-b fixed top-0 left-0 right-0 z-10">
        <button onClick={() => router.back()} className="p-2 bg-muted rounded-full"><ArrowLeft className="h-6 w-6" /></button>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full", isFavorited && "text-red-500 fill-red-500")}
            onClick={toggleFavorite}
          >
            <Heart className={cn("h-6 w-6", isFavorited && "fill-current")} />
          </Button>
          {user && !isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setIsReportDialogOpen(true)}><Flag className="mr-2 h-4 w-4" />Signaler</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-20 pb-24">
        {isOwner && post.status !== 'approved' && (
            <div className="px-6 mb-4">
                {post.status === 'rejected' ? (
                    <Alert variant="destructive"><ShieldAlert /><AlertTitle>Rejetée</AlertTitle><AlertDescription>{post.moderationReason}<br/><Button size="sm" variant="outline" onClick={handleRequestManualReview} disabled={isRequestingReview || post.manualReviewRequested}>{post.manualReviewRequested ? 'Demande envoyée' : 'Analyse manuelle'}</Button></AlertDescription></Alert>
                ) : <Alert><Loader2 className="animate-spin" /><AlertTitle>Validation...</AlertTitle><AlertDescription>En cours d'analyse automatique.</AlertDescription></Alert>}
            </div>
        )}

        {post.media && post.media.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {post.media.map((media, index) => (
                <CarouselItem key={index} className="relative h-80 bg-muted cursor-zoom-in group" onClick={() => openLightbox(media.url)}>
                    <Image src={media.url} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" />
                    </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : <div className="w-full h-80 bg-muted" />}
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div><h1 className="text-2xl font-black">{post.product?.name}</h1><p className="text-muted-foreground text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> {post.location}</p></div>
            <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase">{post.condition}</span>
          </div>
          <div className="text-3xl font-black text-accent">{post.product?.price}</div>
          <p className="text-muted-foreground text-sm leading-relaxed">{post.content}</p>
          
          <div className="flex items-center gap-3 p-4 bg-muted rounded-2xl">
             <Avatar><AvatarImage src={seller.photoURL} /><AvatarFallback>{seller.displayName.charAt(0)}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1.5"><p className="text-sm font-bold">{seller.displayName}</p>{seller.isVerified && <BadgeCheck className="h-5 w-5 fill-accent text-white" />}</div>
              <ReviewStars rating={averageRating} size={14} />
            </div>
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

      <div className="p-4 bg-background border-t flex gap-3 fixed bottom-0 left-0 right-0">
        <a href={whatsappLink} target="_blank" className="flex-1 bg-[#25D366] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><MessageCircle /> WhatsApp</a>
        <a href={telLink} className="bg-primary text-primary-foreground p-4 rounded-2xl"><Phone /></a>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 border-none bg-black/90 flex items-center justify-center overflow-hidden" hideCloseButton>
            <button 
                onClick={() => setIsLightboxOpen(false)} 
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
                <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
                {selectedImageUrl && (
                    <img 
                        src={selectedImageUrl} 
                        alt="Zoom image" 
                        className="max-w-full max-h-full object-contain"
                    />
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
