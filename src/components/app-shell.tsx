
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  LogOut,
  Shield,
  ShoppingBag,
  User as UserIcon,
  PlusCircle,
  Menu,
  Search,
  Heart,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import Footer from './footer';

const navItems = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/dashboard', icon: LayoutGrid, label: 'Explorer' },
  { href: '/dashboard/favorites', icon: Heart, label: 'Favoris' },
  { href: '/dashboard/promotions', icon: ShoppingBag, label: 'Promos' },
  { href: '/dashboard/profile', icon: UserIcon, label: 'Profil' },
  { href: '/dashboard/admin', icon: Shield, label: 'Admin' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user: currentUser } = useUser();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-accent',
        pathname === href && 'bg-accent/10 text-accent font-bold'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar Desktop */}
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-20 items-center border-b px-4 lg:px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="text-accent h-7 w-7 transition-transform group-hover:scale-110" />
              <span className="text-2xl font-black tracking-tight text-foreground">
                Sugu<span className="text-accent">Mali</span>
              </span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col pb-16 md:pb-0">
        {/* Header */}
        <header className="flex h-16 sm:h-20 items-center gap-2 sm:gap-4 border-b bg-card px-4 lg:px-6 sticky top-0 z-20">
          <Link href="/" className="md:hidden flex items-center gap-1.5 ml-1">
             <Logo className="text-accent h-6 w-6" />
             <span className="text-lg font-black tracking-tight text-foreground">
                Sugu<span className="text-accent">Mali</span>
             </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {pathname !== '/dashboard/sell' && (
              <Button asChild className="bg-accent text-accent-foreground relative group rounded-full px-4 sm:px-6 h-9 sm:h-11 font-bold transition-all duration-300 hover:bg-accent/90 shadow-sm active:scale-95 border-none text-xs sm:text-sm">
                <Link href="/dashboard/sell">
                  <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="hidden sm:inline">Vendre un article</span>
                  <span className="sm:hidden">Vendre</span>
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden border border-border"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={currentUser?.photoURL ?? undefined}
                      alt={currentUser?.displayName ?? ''}
                    />
                    <AvatarFallback>
                      {currentUser?.displayName?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Menu utilisateur</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-bold">{currentUser?.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Accueil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Contenu Principal */}
        <main className="flex flex-1 flex-col bg-background">{children}</main>

        <Footer />

        {/* Barre de navigation basse (Mobile Only) */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-40 px-4 h-16 flex items-center justify-around">
            {navItems.filter(item => item.href !== '/dashboard/admin').map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href} 
                        href={item.href} 
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            isActive ? "text-accent" : "text-muted-foreground"
                        )}
                    >
                        <Icon className={cn("h-5 w-5", isActive && "fill-accent/20")} />
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </Link>
                );
            })}
             <Link 
                href="/dashboard/sell" 
                className={cn(
                    "flex flex-col items-center gap-1",
                    pathname === '/dashboard/sell' ? "text-accent" : "text-muted-foreground"
                )}
            >
                <div className="bg-accent text-white p-2 rounded-full -mt-8 shadow-lg ring-4 ring-background">
                    <PlusCircle className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold">Vendre</span>
            </Link>
        </div>
      </div>
    </div>
  );
}
