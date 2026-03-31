'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Search, PlusCircle, LogOut, LayoutGrid, User as UserIcon, Sparkles, Star } from 'lucide-react';
import Footer from '@/components/footer';
import ThemeToggle from '@/components/theme-toggle';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Post } from '@/lib/data';
import { collection, onSnapshot, query, where, doc, setDoc, increment } from 'firebase/firestore';

// ── Carte annonce compacte ──────────────────────────────────────────────────
const FeaturedProductCard = ({
  id, title, price, location, image, condition, sponsored
}: {
  id: string; title: string; price: string; location: string;
  image: string; condition?: string; sponsored?: boolean;
}) => (
  <Link
    href={`/annonces/${id}`}
    className="group cursor-pointer block bg-card/40 border border-white/5 rounded-2xl p-2.5 shadow-sm hover:shadow-xl transition-all duration-300 relative h-full"
  >
    {sponsored && (
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-yellow-400/90 text-yellow-900 px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-lg">
        <Star className="h-2 w-2 fill-yellow-900" />
        Sponsorisé
      </div>
    )}

    <div className="relative h-32 sm:h-44 bg-muted rounded-xl overflow-hidden flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => { 
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const logoDiv = parent.querySelector('.logo-fallback');
              if (logoDiv) (logoDiv as HTMLElement).style.display = 'flex';
            }
          }}
        />
      ) : null}
      
      <div className={`logo-fallback absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 ${image ? 'hidden' : 'flex'}`}>
        <Logo className="h-12 w-12 opacity-40 mb-2" />
        <span className="text-[10px] font-black text-muted-foreground/40 tracking-widest uppercase">SuguMali</span>
      </div>

      {condition && (
        <div className="absolute top-2 left-2 bg-accent text-white px-2 py-0.5 rounded-md text-[9px] font-bold shadow-lg">
          {condition}
        </div>
      )}
    </div>
    <div className="mt-2.5 px-1">
      <h3 className="font-bold text-foreground truncate text-sm sm:text-base leading-tight">{title}</h3>
      <p className="text-accent font-black text-base sm:text-lg mt-0.5">{price}</p>
      <div className="flex items-center gap-1 text-muted-foreground text-[9px] sm:text-xs mt-1">
        <span className="truncate">📍 {location}</span>
      </div>
    </div>
  </Link>
);

function Header() {
  const router = useRouter();
  const { user, loading } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 min-w-fit group">
          <Logo className="h-7 w-7 sm:h-8 transition-transform group-hover:scale-110" />
          <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Sugu<span className="text-accent">Mali</span></span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <Button asChild className="rounded-full font-bold px-3 sm:px-5 bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/10 transition-all active:scale-95 border-none h-8 sm:h-10 text-[11px] sm:text-sm">
                <Link href="/dashboard/sell" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" /><span>Vendre</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-white/10 ml-1 sm:ml-2">
                    <Avatar className="h-8 w-8 sm:h-9 w-9">
                      <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? ''} />
                      <AvatarFallback className="bg-muted text-accent font-bold">
                        {user.displayName?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl border-white/10">
                  <DropdownMenuLabel className="font-bold">{user.displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard"><LayoutGrid className="mr-2 h-4 w-4 text-accent" /><span>Tableau de bord</span></Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard/profile"><UserIcon className="mr-2 h-4 w-4 text-accent" /><span>Profil</span></Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>Se déconnecter</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="font-bold text-foreground/80 hover:bg-accent hover:text-white h-8 sm:h-10 text-[11px] sm:text-sm px-2 sm:px-4 transition-colors rounded-xl">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild className="rounded-full font-bold px-3 sm:px-5 bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/10 transition-all active:scale-95 border-none h-8 sm:h-10 text-[11px] sm:text-sm">
                <Link href="/login" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" /><span>Vendre</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function HomePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [searchValue, setSearchValue] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (firestore) {
      const statsRef = doc(firestore, 'site_stats', 'counters');
      setDoc(statsRef, { visits: increment(1) }, { merge: true }).catch(() => {});
    }
  }, [firestore]);

  useEffect(() => {
    if (!firestore) return;

    const annoncesRef = collection(firestore, 'annonces');
    const q = query(annoncesRef, where('status', '==', 'approved'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        const base64Image = data.image || (data.media && data.media[0]?.url) || data.imageUrl || null;

        return {
          id: doc.id,
          vendeurId: data.vendeurId,
          vendeurVerified: Boolean(data.vendeurVerified || data.isVerified),
          content: data.description || '',
          media: data.media || (base64Image ? [{ url: base64Image, type: 'image' as const }] : []),
          image: base64Image,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          isProduct: true,
          isPromoted: Boolean(data.isPromoted),
          sponsored: Boolean(data.sponsored),
          location: data.localisation || 'Mali',
          whatsappNumber: data.whatsapp || '',
          category: data.categorie || '',
          condition: data.etat || 'Occasion',
          status: data.status || 'approved',
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
          isSold: data.status === 'sold',
          product: {
            name: data.titre || 'Sans titre',
            price: data.prix || '0 FCFA',
            url: `/annonces/${doc.id}`,
          },
        } as Post;
      });

      // --- TRI HIÉRARCHIQUE : BOOSTÉS > CERTIFIÉS > RESTE ---
      const sorted = [...posts].sort((a, b) => {
        // 1. Sponsorisés ou Promus d'abord (Priorité Haute)
        const priorityA = (a.sponsored || a.isPromoted) ? 1 : 0;
        const priorityB = (b.sponsored || b.isPromoted) ? 1 : 0;
        if (priorityA !== priorityB) return priorityB - priorityA;

        // 2. Vendeurs certifiés ensuite (Priorité Moyenne)
        const certA = a.vendeurVerified ? 1 : 0;
        const certB = b.vendeurVerified ? 1 : 0;
        if (certA !== certB) return certB - certA;

        // 3. Date la plus récente pour tout le reste
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setFeaturedProducts(sorted);
      setIsLoading(false);
    }, async () => {
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleSearch = () => {
    if (!searchValue.trim()) { router.push('/dashboard'); return; }
    router.push(`/dashboard?search=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-white">
      <Header />
      <main className="flex-1">
        <section className="relative pt-32 sm:pt-48 pb-10 sm:pb-16 px-6 sm:px-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <p className="text-muted-foreground font-medium text-sm sm:text-base md:text-lg max-w-xl mx-auto opacity-70">
              Rejoignez la plus grande communauté de commerce local au Mali.
            </p>
            <div className="mt-6 sm:mt-10 max-w-2xl mx-auto">
              <div className="flex items-center h-[50px] sm:h-[54px] pl-5 pr-1.5 rounded-full bg-white dark:bg-[#1A1D23] border border-[#E8E8E8] dark:border-white/10 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-accent/50">
                <Sparkles className="h-5 w-5 text-accent/50 shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder="Que cherchez-vous ?"
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-[15px] sm:text-[16px] outline-none placeholder-[#A0A0A0] text-[#333333] dark:text-white"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  className="h-10 sm:h-11 w-10 sm:w-11 p-0 rounded-full bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/10 transition-all active:scale-95 border-none flex items-center justify-center shrink-0 ml-2"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-10 pt-8 pb-12 sm:pt-12 sm:pb-20">
          <div className="flex justify-between items-end mb-6 sm:mb-8 px-2">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground inline-block relative">
                Annonces à la une
                <span className="absolute -bottom-1 left-0 w-8 h-1 sm:h-1.5 bg-accent rounded-full"></span>
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                Vendeurs certifiés & Annonces boostées en priorité
              </p>
            </div>
            <Link href="/dashboard" className="group flex items-center gap-1 sm:gap-2 text-accent font-black py-2 hover:opacity-80 transition-all text-sm sm:text-base">
              Voir tout <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 px-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card/40 border border-white/5 rounded-2xl p-3">
                  <Skeleton className="h-32 sm:h-44 w-full rounded-xl" />
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 px-2">
              {featuredProducts.slice(0, 24).map((post: Post) => (
                <FeaturedProductCard
                  key={post.id}
                  id={post.id}
                  title={post.product?.name || post.titre || post.content || ''}
                  price={post.product?.price || (typeof post.prix === 'string' ? post.prix : `${post.prix} FCFA`)}
                  location={post.localisation || post.location || 'N/A'}
                  image={post.image || (post.media && post.media[0]?.url) || ''}
                  condition={post.etat || post.condition}
                  sponsored={post.sponsored || post.isPromoted}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed mx-2">
                <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">Aucune annonce disponible pour le moment.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
