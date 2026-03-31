'use client';

import Image from 'next/image';
import type { Post } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, MapPin, Rocket, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedPrice = post.price 
    ? `${post.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`
    : null;

  const title = post.title || "Sans titre";

  // LOGIQUE CORRIGÉE : On vérifie media OU le champ image direct
  const firstMedia = (post.media && post.media.length > 0) 
    ? post.media[0] 
    : (post.image ? { type: 'image', url: post.image } : null);

  return (
    <Link href={`/annonces/${post.id}`} className="group block bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border/50 overflow-hidden flex flex-col relative h-full">
      <div className="relative h-48 bg-muted overflow-hidden">
        {/* Badge Vendu */}
        {post.isSold && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-destructive text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 scale-110">
              <CheckCircle2 className="h-4 w-4" />
              Vendu
            </div>
          </div>
        )}
        
        {/* Badge Sponsorisé */}
        {post.isPromoted && !post.isSold && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-bold py-1 px-2 rounded-full shadow-lg">
                <Rocket className="h-3 w-3" />
                <span>Sponsorisé</span>
            </div>
        )}

        {/* Affichage du Média (Image ou Vidéo) */}
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <Image 
              src={firstMedia.url} 
              alt={title}
              fill 
              className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", post.isSold && "grayscale-[0.5]")} 
              unoptimized={firstMedia.url.startsWith('data:')} // Important pour les images en base64
            />
          ) : (
            <div className="relative w-full h-full">
               <video 
                src={firstMedia.url} 
                className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", post.isSold && "grayscale-[0.5]")} 
                muted 
                loop 
                playsInline 
                autoPlay 
              />
              {!post.isSold && (
                <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded-full">
                  <Play className="h-3 w-3 text-white fill-current" />
                </div>
              )}
            </div>
          )
        ) : (
          /* Si aucune image n'est trouvée */
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-100">
              <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">SuguMali</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={cn("font-bold text-card-foreground truncate", post.isSold && "text-muted-foreground")} title={title}>
          {title}
        </h3>
        
        {formattedPrice && (
            <p className={cn("text-orange-500 font-extrabold text-xl mt-1", post.isSold && "text-muted-foreground line-through")}>
              {formattedPrice}
            </p>
        )}
        
        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
          {post.location ? (
            <>
              <MapPin className="h-4 w-4" />
              <span>{post.location}</span>
            </>
          ) : (
            <span>Bamako</span>
          )}
        </div>

        <div className="mt-auto pt-4">
            <Button className={cn("w-full font-bold rounded-xl border-none", post.isSold ? "bg-muted text-muted-foreground" : "bg-orange-500 hover:bg-orange-600 text-white")} tabIndex={-1}>
              {post.isSold ? 'Voir l\'annonce' : 'Voir les détails'}
            </Button>
        </div>
      </div>
    </Link>
  );
}