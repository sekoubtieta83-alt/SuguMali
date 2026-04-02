'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/dashboard/post-card";
import { type Post } from "@/lib/data";
import { Edit, Search, Bell, BellOff, Loader2, BadgeCheck, ShieldCheck, Upload, Trash2, AlertTriangle, Smartphone, CheckCircle2, MessageSquare, Info, Camera, Send, Rocket, UserMinus, User } from "lucide-react";
import { useFirebaseApp, useFirestore, useUser, useAuth } from "@/firebase";
import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { collection, doc, onSnapshot, query, updateDoc, where, serverTimestamp, writeBatch, deleteDoc, getDocs } from "firebase/firestore";
import { getStorage, uploadString, getDownloadURL, ref } from 'firebase/storage';
import { deleteUser, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { EditProfileForm } from "@/components/dashboard/edit-profile-form";
import { requestNotificationPermission } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { type Review, ReviewCard } from "@/components/dashboard/review-card";
import { ReviewStars } from "@/components/dashboard/review-stars";
import { addYears, isAfter } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Label } from "@/components/ui/label";

export type UserProfile = {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    isVerified: boolean;
    verifiedAt?: any;
    verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
    isVerificationPaid?: boolean;
    idDocumentUrl?: string;
    paymentScreenshotUrl?: string;
    isBanned?: boolean;
    bio?: string;
    fcmTokens?: string[];
    createdAt?: any;
};

export function checkIsVerified(profile: UserProfile | null): boolean {
    if (!profile || !profile.isVerified || !profile.verifiedAt) return false;
    try {
        const verifiedDate = profile.verifiedAt.toDate ? profile.verifiedAt.toDate() : new Date(profile.verifiedAt);
        const expiryDate = addYears(verifiedDate, 1);
        return isAfter(expiryDate, new Date());
    } catch (e) {
        return false;
    }
}

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const app = useFirebaseApp();
  const router = useRouter();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [isNotificationSupported, setIsNotificationSupported] = useState<boolean>(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'id' | 'payment'>('id');
  const [isPaying, setIsPaying] = useState(false);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setIsNotificationSupported('Notification' in window && 'serviceWorker' in navigator);
    }
  }, []);

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setUserProfile(data);
          if (data.idDocumentUrl && !data.isVerificationPaid) {
            setVerificationStep('payment');
          }
        } else {
          // Si le profil n'existe pas encore dans Firestore, on utilise les infos Auth
          setUserProfile({
            uid: user.uid,
            displayName: user.displayName || 'Utilisateur',
            email: user.email || '',
            photoURL: user.photoURL || '',
            isVerified: false,
            verificationStatus: 'none',
          });
        }
      }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      return () => unsubscribe();
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!firestore || !user) return;
    const annoncesRef = collection(firestore, 'annonces');
    const q = query(annoncesRef, where('vendeurId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setUserPosts(postsFromFirestore);
      setPostsLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: annoncesRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setPostsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  useEffect(() => {
    if (userProfile?.fcmTokens && userProfile.fcmTokens.length > 0) {
        setNotificationsEnabled(true);
    } else {
        setNotificationsEnabled(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!firestore || !user) return;
    const reviewsRef = collection(firestore, 'reviews');
    const q = query(reviewsRef, where('sellerId', '==', user.uid));
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
  }, [firestore, user]);

  const handleToggleNotifications = async () => {
    if (!app || !user || !firestore || !isNotificationSupported) return;
    setIsNotificationLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    if (notificationsEnabled) {
        updateDoc(userRef, { fcmTokens: [] })
          .then(() => {
            setNotificationsEnabled(false);
            toast({ title: "Notifications désactivées" });
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'update',
              requestResourceData: { fcmTokens: [] },
            });
            errorEmitter.emit('permission-error', permissionError);
          })
          .finally(() => setIsNotificationLoading(false));
    } else {
        try {
            await requestNotificationPermission(app, user, firestore);
            setNotificationsEnabled(true);
            toast({ title: "Notifications activées !" });
        } catch (error: any) {
            console.log("Erreur notification :", error.message);
        } finally {
            setIsNotificationLoading(false);
        }
    }
  };

  const handleDeleteAllAnnonces = async () => {
    if (!firestore || !user || userPosts.length === 0) return;
    setIsDeletingAll(true);
    const batch = writeBatch(firestore);
    userPosts.forEach(post => {
        const docRef = doc(firestore, 'annonces', post.id);
        batch.delete(docRef);
    });
    batch.commit()
        .then(() => toast({ title: "Nettoyage réussi" }))
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: 'annonces',
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsDeletingAll(false));
  };

  const handleDeleteAccount = async () => {
    if (!firestore || !user || !auth.currentUser) return;
    setIsDeletingAccount(true);

    const userId = user.uid;

    try {
      // 1. D'abord, nettoyer les données Firestore (nécessite d'être authentifié)
      
      // Supprimer les annonces
      const annoncesRef = collection(firestore, 'annonces');
      const q = query(annoncesRef, where('vendeurId', '==', userId));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Supprimer le profil Firestore
      const profileRef = doc(firestore, 'users', userId);
      await deleteDoc(profileRef).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: profileRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

      // 2. Enfin, tenter la suppression Auth (opération la plus sensible qui peut échouer)
      await deleteUser(auth.currentUser);

      toast({ title: "Compte supprimé", description: "Votre compte et vos données ont été effacés." });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        toast({ 
          variant: 'destructive', 
          title: "Action sécurisée", 
          description: "Pour supprimer votre identifiant de connexion, déconnectez-vous et reconnectez-vous, puis réessayez. Vos annonces ont déjà été retirées." 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Erreur", 
          description: "Une erreur est survenue lors de la suppression définitive." 
        });
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleIdFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setIdPhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitId = async () => {
    if (!user || !firestore || !idPhoto || !app) return;
    setIsSubmittingId(true);

    try {
      const storage = getStorage(app);
      const fileName = `id_documents/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadString(storageRef, idPhoto, 'data_url');
      const idUrl = await getDownloadURL(storageRef);

      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, { 
        idDocumentUrl: idUrl 
      });
      
      toast({ title: "Pièce d'identité enregistrée !" });
      setVerificationStep('payment');
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de l'envoi" });
    } finally {
      setIsSubmittingId(false);
    }
  };

  const handlePaymentFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPaymentScreenshot(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalizeVerification = async () => {
    if (!user || !firestore || !paymentScreenshot || !app) return;
    setIsPaying(true);

    try {
      const storage = getStorage(app);
      const fileName = `verification_payments/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadString(storageRef, paymentScreenshot, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(firestore, 'users', user.uid);
      const updateData = { 
        verificationStatus: 'pending', 
        isVerificationPaid: true,
        paymentScreenshotUrl: downloadURL 
      };
      
      await updateDoc(userRef, updateData);
      toast({ title: "Demande complète envoyée !" });
      setIsVerifyDialogOpen(false);
      setVerificationStep('id');
      setPaymentScreenshot(null);
      setIdPhoto(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur" });
    } finally {
      setIsPaying(false);
    }
  };

  const isVerified = checkIsVerified(userProfile);
  const filteredUserPosts = userPosts.filter(post => {
    const title = post.product?.name || post.content || '';
    const queryText = searchQuery.toLowerCase();
    return title.toLowerCase().includes(queryText) || (post.content || '').toLowerCase().includes(queryText);
  });

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  if (userLoading || (!userProfile && !user)) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8" /></div>;
  }

  // Fallback profile if Firestore is still loading but Auth is ready
  const currentProfile = userProfile || {
    uid: user?.uid || '',
    displayName: user?.displayName || 'Utilisateur',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    isVerified: false,
  } as UserProfile;

  return (
    <div className="flex flex-1 flex-col pb-20">
      <div className="relative h-40 sm:h-48 w-full bg-muted">
        <img src="https://picsum.photos/seed/cover1/1200/200" alt="Couverture" className="h-full w-full object-cover" data-ai-hint="abstract background"/>
        <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage src={currentProfile.photoURL ?? undefined} alt={currentProfile.displayName ?? ""} />
            <AvatarFallback className="bg-accent text-white font-black text-2xl">{currentProfile.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      <div className="flex justify-end p-3 sm:p-4 border-b gap-2 sm:gap-3">
        {currentProfile.isBanned && <div className="bg-destructive/10 text-destructive px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold flex items-center">Compte suspendu</div>}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-xl"><Edit className="h-4 w-4 mr-1 sm:mr-2" /> Modifier</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Modifier le profil</DialogTitle></DialogHeader>
                <EditProfileForm userProfile={currentProfile} onFinished={() => setIsEditDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 sm:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8">
        <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{currentProfile.displayName}</h1>
             {isVerified && <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 fill-accent text-white" />}
        </div>
        <p className="text-muted-foreground text-sm">{currentProfile.email}</p>
        <p className="mt-4 text-xs sm:text-sm max-w-2xl leading-relaxed">{currentProfile.bio || "Ajoutez une biographie pour vous présenter !"}</p>

        <div className="mt-4 flex items-center gap-2">
            {reviews.length > 0 ? (
                <>
                    <ReviewStars rating={averageRating} size={14} />
                    <span className="text-muted-foreground text-[10px] sm:text-sm font-medium">{averageRating.toFixed(1)} ({reviews.length} avis)</span>
                </>
            ) : <p className="text-[10px] sm:text-sm text-muted-foreground">Pas encore d'avis</p>}
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 bg-muted rounded-2xl sm:rounded-3xl border border-border/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <ShieldCheck className={`h-5 w-5 sm:h-6 sm:w-6 ${isVerified ? 'text-accent' : 'text-muted-foreground'}`} />
                    <h2 className="text-lg sm:text-xl font-bold">Certification</h2>
                </div>
                {isVerified ? (
                    <div className="bg-green-500/10 text-green-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3">
                        <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 fill-accent text-white" />
                        <p className="text-xs sm:text-sm font-bold">Profil certifié SuguMali.</p>
                    </div>
                ) : currentProfile.verificationStatus === 'pending' ? (
                    <div className="bg-accent/10 text-accent p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <p className="text-xs sm:text-sm font-bold">Vérification en cours...</p>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">Badge orange pour 5 000 FCFA/an.</p>
                        <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
                            <DialogTrigger asChild><Button className="w-full rounded-xl sm:rounded-2xl font-bold bg-accent hover:bg-accent/90 text-white h-10 sm:h-12 text-xs sm:text-sm">Certifier mon compte</Button></DialogTrigger>
                            <DialogContent className="w-[95vw] sm:max-w-[380px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                                <div className="bg-accent p-4 text-white text-center relative overflow-hidden">
                                  <ShieldCheck className="absolute -right-4 -bottom-4 h-16 w-20 text-white/10 rotate-12" />
                                  <DialogHeader>
                                    <DialogTitle className="text-xl font-black mb-0.5">Certification SuguMali</DialogTitle>
                                    <DialogDescription className="text-white/90 font-medium text-[9px] leading-relaxed">
                                      Inspirez confiance et vendez plus vite.
                                    </DialogDescription>
                                  </DialogHeader>
                                </div>

                                {verificationStep === 'id' ? (
                                    <div className="p-4 space-y-4 bg-background">
                                        <div className="space-y-2">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Étape 1 : Identité</h3>
                                            <Label className="text-[10px] font-black">Photo de votre pièce d'identité</Label>
                                            <input type="file" ref={fileInputRef} onChange={handleIdFileSelect} accept="image/*" className="hidden" />
                                            {idPhoto ? (
                                                <div className="relative group rounded-xl overflow-hidden border-2 border-accent/20 shadow-lg">
                                                    <img src={idPhoto} className="w-full aspect-video object-cover" alt="ID Document" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button variant="secondary" size="sm" onClick={() => setIdPhoto(null)} className="rounded-xl font-bold h-7 text-[10px]">Changer</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-muted/10 hover:bg-muted/20 transition-all">
                                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Télécharger ma pièce</span>
                                                </button>
                                            )}
                                        </div>
                                        <Button onClick={handleSubmitId} className="w-full rounded-xl h-11 font-black text-sm shadow-xl shadow-accent/20" disabled={!idPhoto || isSubmittingId}>
                                            {isSubmittingId ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
                                            Suivant : Paiement
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-4 bg-background">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Étape 2 : Paiement</h3>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-[9px]" onClick={() => setVerificationStep('id')}>Retour à l'ID</Button>
                                        </div>
                                        <div className="grid gap-1.5">
                                          <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2.5">
                                              <div className="h-7 w-7 bg-[#FF8C00] rounded-full flex items-center justify-center text-white font-black text-[9px]">OM</div>
                                              <div>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase">Orange Money</p>
                                                <p className="text-xs font-black">79 05 28 86</p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-accent font-black text-[10px]">5 000 FCFA</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2.5">
                                              <div className="h-7 w-7 bg-[#1cbcfc] rounded-full flex items-center justify-center text-white font-black text-[9px]">W</div>
                                              <div>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase">Wave</p>
                                                <p className="text-xs font-black">79 05 28 86</p>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-accent font-black text-[10px]">5 000 FCFA</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black flex items-center gap-2">
                                            Preuve de paiement 
                                            <span className="text-[9px] font-normal text-muted-foreground">(Capture d'écran)</span>
                                        </Label>
                                        {paymentScreenshot ? (
                                          <div className="relative group rounded-xl overflow-hidden border-2 border-accent/20 shadow-lg">
                                            <img src={paymentScreenshot} alt="Screenshot" className="w-full aspect-video object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button variant="secondary" size="sm" onClick={() => setPaymentScreenshot(null)} className="rounded-xl font-bold h-7 text-[10px]">Modifier</Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={() => paymentInputRef.current?.click()}
                                            className="w-full aspect-video border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-muted/50 hover:border-accent/40 transition-all group"
                                          >
                                            <div className="bg-muted p-2 rounded-full group-hover:bg-accent/10 transition-colors">
                                                <Camera className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                                            </div>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Ajouter la capture</span>
                                          </button>
                                        )}
                                        <input type="file" ref={paymentInputRef} onChange={handlePaymentFileSelect} accept="image/*" className="hidden" />
                                      </div>

                                      <Button 
                                        className="w-full h-10 rounded-xl font-black text-sm bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                        disabled={!paymentScreenshot || isPaying}
                                        onClick={handleFinalizeVerification}
                                      >
                                        {isPaying ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                                        Finaliser ma demande
                                      </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
            
            <div className="p-4 sm:p-6 bg-muted rounded-2xl sm:rounded-3xl border border-border/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4"><Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /><h2 className="text-lg sm:text-xl font-bold">Alertes</h2></div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-background rounded-xl sm:rounded-2xl border border-border/50">
                    <div className="flex-1 mr-4">
                        <h3 className="text-xs sm:text-sm font-semibold">Notifications Push</h3>
                        <p className="text-[10px] text-muted-foreground">Suivi de vos annonces et messages.</p>
                    </div>
                    {isNotificationSupported && (
                      <Button 
                          onClick={handleToggleNotifications} 
                          disabled={isNotificationLoading} 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-lg"
                      >
                          {isNotificationLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                          ) : notificationsEnabled ? (
                              <BellOff className="h-3 w-3" />
                          ) : (
                              <Bell className="h-3 w-3" />
                          )}
                      </Button>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 bg-secondary/30 flex-1">
        <Tabs defaultValue="posts" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-1 gap-4">
                <TabsList className="bg-card rounded-xl h-auto p-1 border">
                    <TabsTrigger value="posts" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2">
                        Mes publications
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2">
                        Mes avis ({reviews.length})
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="m-0 mt-0 w-full md:w-auto">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input placeholder="Rechercher..." className="pl-10 bg-card rounded-xl h-9 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        {userPosts.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="rounded-xl font-bold w-full sm:w-auto h-9">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Tout supprimer
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl max-w-sm">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                            <AlertTriangle className="h-5 w-5" />
                                            Attention
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action supprimera **définitivement** vos {userPosts.length} annonces. Voulez-vous continuer ?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteAllAnnonces} disabled={isDeletingAll} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">
                                            {isDeletingAll ? <Loader2 className="animate-spin h-4 w-4" /> : "Oui, tout supprimer"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </TabsContent>
            </div>

            <TabsContent value="posts" className="mt-0">
                {postsLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredUserPosts.length > 0 ? filteredUserPosts.map(post => <PostCard key={post.id} post={post} />) : <div className="col-span-full py-10 sm:py-20 text-center text-muted-foreground text-xs sm:text-sm">Aucune annonce trouvée.</div>}</div>}
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
                {reviews.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reviews.map(review => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-muted-foreground/30">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-bold">Aucun avis reçu</h3>
                        <p className="text-sm text-muted-foreground">Vos acheteurs peuvent laisser un avis après un achat.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>

        {/* ZONE DE DANGER */}
        <div className="mt-12 pt-8 border-t border-destructive/20">
            <h3 className="text-destructive font-black uppercase tracking-widest text-sm mb-4">Zone de danger</h3>
            <div className="p-6 bg-destructive/5 rounded-[2rem] border border-destructive/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h4 className="font-bold text-foreground">Supprimer mon compte</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">Cette action supprimera définitivement votre profil, vos annonces et vos avis. Cette action est irréversible.</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-xl font-bold px-8 h-12 shadow-lg shadow-destructive/20">
                            <UserMinus className="h-4 w-4 mr-2" />
                            Supprimer mon compte
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem] max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-6 w-6" />
                                Action irréversible
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                Êtes-vous absolument sûr ? Toutes vos données (annonces, favoris, profil) seront supprimées de SuguMali sans possibilité de retour.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="rounded-xl font-bold">Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteAccount} 
                                disabled={isDeletingAccount} 
                                className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold"
                            >
                                {isDeletingAccount ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Oui, supprimer tout"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>
    </div>
  );
}
