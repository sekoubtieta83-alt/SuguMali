'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles, ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MamiAssistant, { type MamiMessage, type MamiProduct, type SponsoredAnnonce } from '@/lib/mami';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Link from 'next/link';

interface FirestoreAnnonce {
  id: string;
  titre: string;
  prix: string;
  image?: string;
  imageUrl?: string;
  localisation: string;
  categorie: string;
  sponsored?: boolean;
  etat?: string;
}

function ProductCard({
  product,
  annonce,
}: {
  product: MamiProduct & { id?: string; sponsored?: boolean; deal?: boolean };
  annonce?: FirestoreAnnonce;
}) {
  const image = annonce?.imageUrl || annonce?.image;
  const href = annonce ? `/annonces/${annonce.id}` : '/dashboard';
  const title = annonce?.titre || product.name;
  const price = annonce?.prix || product.price;
  const location = annonce?.localisation;

  return (
    <Link href={href} className="block group">
      <div className={cn(
        'bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm',
        'hover:shadow-md transition-all duration-200 hover:scale-[1.01]',
        product.sponsored ? 'border-yellow-400/60 ring-1 ring-yellow-400/30' : 'border-border/50'
      )}>
        <div className="relative h-24 bg-muted overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-accent/10 to-accent/5">
              {product.emoji}
            </div>
          )}
          {product.sponsored && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow">
              <Star className="h-2 w-2 fill-yellow-900" /> Sponsorisé
            </div>
          )}
          {product.deal && !product.sponsored && (
            <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black shadow">
              Offre spéciale
            </div>
          )}
        </div>
        <div className="p-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs truncate">{title}</h4>
            <p className="text-accent font-black text-sm mt-0.5">{price}</p>
            {location && <p className="text-[9px] text-muted-foreground mt-0.5 truncate">📍 {location}</p>}
            {product.tag && (
              <span className="inline-block text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-md font-bold mt-1">
                {product.tag}
              </span>
            )}
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-accent/60 shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function MessageBubble({
  message, mami, annoncesMap, mamiImage,
}: {
  message: MamiMessage;
  mami: MamiAssistant;
  annoncesMap: Map<string, FirestoreAnnonce>;
  mamiImage?: string;
}) {
  const productsData = mami.parseProducts(message.content);
  const text = mami.cleanText(message.content);
  const sortedItems = productsData?.items
    ? [...productsData.items].sort((a: any, b: any) =>
        a.sponsored === b.sponsored ? 0 : a.sponsored ? -1 : 1
      )
    : [];

  return (
    <div className={cn('flex flex-col gap-2 mb-4', message.role === 'user' ? 'items-end' : 'items-start')}>
      <div className="flex items-end gap-2">
        {message.role === 'model' && (
          <Avatar className="h-6 w-6 border border-border shrink-0">
            <AvatarImage src={mamiImage} alt="Mami" />
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
        )}
        <div className={cn(
          'max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed',
          message.role === 'user'
            ? 'bg-accent text-white rounded-tr-none'
            : 'bg-card text-foreground rounded-tl-none border border-border/50'
        )}>
          {text}
        </div>
      </div>
      {sortedItems.length > 0 && (
        <div className="grid grid-cols-1 gap-2 w-full max-w-[85%] ml-8">
          {sortedItems.map((p: any, idx: number) => {
            const annonce = p.id && p.id !== 'null' && p.id !== 'firestore_id_ou_null' && p.id !== 'vrai_id_firestore'
              ? annoncesMap.get(p.id) : undefined;
            return <ProductCard key={idx} product={p} annonce={annonce} />;
          })}
        </div>
      )}
    </div>
  );
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const firestore = useFirestore();
  const mamiImage = PlaceHolderImages.find(img => img.id === 'mami')?.imageUrl;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MamiMessage[]>([
    { role: 'model', content: "Bonjour ! Je suis Mami 🌸. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [annoncesMap, setAnnoncesMap] = useState<Map<string, FirestoreAnnonce>>(new Map());
  const [sponsoredAnnonces, setSponsoredAnnonces] = useState<SponsoredAnnonce[]>([]);
  const [allAnnonces, setAllAnnonces] = useState<SponsoredAnnonce[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mami = useMemo(() => new MamiAssistant(), []);

  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    if (!firestore) return;
    const load = async () => {
      try {
        const ref = collection(firestore, 'annonces');
        const snap = await getDocs(query(ref, where('status', '==', 'approved'), limit(80)));
        const map = new Map<string, FirestoreAnnonce>();
        const sponsored: SponsoredAnnonce[] = [];
        const all: SponsoredAnnonce[] = [];

        snap.docs.forEach(doc => {
          const d = doc.data();
          map.set(doc.id, {
            id: doc.id, titre: d.titre || '', prix: d.prix || '',
            image: d.image || '', imageUrl: d.imageUrl || '',
            localisation: d.localisation || '', categorie: d.categorie || '',
            sponsored: d.sponsored || false, etat: d.etat || '',
          });
          const annonce = { id: doc.id, titre: d.titre || '', prix: d.prix || '', categorie: d.categorie || '', localisation: d.localisation || '' };
          all.push(annonce);
          if (d.sponsored) sponsored.push(annonce);
        });

        setAnnoncesMap(map);
        setSponsoredAnnonces(sponsored);
        setAllAnnonces(all);
      } catch (e) { console.error('Erreur annonces Mami:', e); }
    };
    load();
  }, [firestore]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  if (isDashboard) return null;

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: MamiMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    try {
      const response = await mami.chat(currentMessages, { sponsoredAnnonces, allAnnonces });
      setMessages(prev => [...prev, { role: 'model', content: response.raw }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Désolée, je rencontre une petite difficulté. Réessayez dans un instant 🌸"
      }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <Card className="w-[90vw] sm:w-[380px] h-[520px] shadow-2xl rounded-3xl overflow-hidden border-none flex flex-col animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-accent text-white p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarImage src={mamiImage} alt="Mami" className="object-cover" />
                  <AvatarFallback className="bg-white/20 text-white font-black">M</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-black leading-none">Assistante Mami</CardTitle>
                  <p className="text-[10px] opacity-80 font-medium flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-300 inline-block" />
                    Spécialiste SuguMali
                    {sponsoredAnnonces.length > 0 && (
                      <span className="bg-yellow-400/30 px-1.5 py-0.5 rounded-full text-[9px] font-black ml-1">
                        ⭐ {sponsoredAnnonces.length} sponsorisée{sponsoredAnnonces.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/10 rounded-full h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col bg-muted/30 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} mami={mami} annoncesMap={annoncesMap} mamiImage={mamiImage} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs italic ml-8 mb-4">
                    <Loader2 className="h-3 w-3 animate-spin" /> Mami réfléchit...
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-3 bg-background border-t shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Posez votre question à Mami..."
                  className="flex-1 bg-muted border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-accent/50 outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button size="icon" onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl bg-accent text-white hover:bg-accent/90 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/30 flex items-center justify-center p-0 transition-all hover:scale-110 active:scale-95 overflow-hidden relative">
          {mamiImage ? (
            <img src={mamiImage} alt="Mami" className="w-full h-full object-cover" />
          ) : (
            <MessageCircle className="h-7 w-7" />
          )}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
        </Button>
      )}
    </div>
  );
}