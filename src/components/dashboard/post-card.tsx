'use client';

import Image from 'next/image';
import type { Post } from '@/lib/data';
import Link from 'next/link';
import { CheckCircle2, Play, MapPin } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Gestion du prix formaté
  const formattedPrice = post.prix 
    ? `${post.prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`
    : null;

  const title = post.titre || "Annonce sans titre";
  const location = post.localisation || "Mali";

  // Logique de récupération d'image améliorée
  let imageUrl = null;
  let isVideo = false;

  if (post.image) {
    imageUrl = post.image;
  } else if (post.media && post.media.length > 0) {
    imageUrl = post.media[0].url;
    isVideo = post.media[0].type === 'video';
  }

  return (
    <Link 
      href={`/annonces/${post.id}`} 
      className="group block bg-[#12141c] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-white/5 overflow-hidden flex flex-col h-full"
      title={`${title} à ${location}`}
    >
      <div className="relative h-48 bg-muted overflow-hidden flex items-center justify-center">
        {post.status === 'sold' && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-destructive text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 scale-110">
              <CheckCircle2 className="h-4 w-4" />
              Vendu
            </div>
          </div>
        )}

        {imageUrl ? (
          !isVideo ? (
            <Image 
              src={imageUrl} 
              alt={`${title} - ${location} | SuguMali`}
              fill 
              className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", post.status === 'sold' && "grayscale-[0.5]")} 
              unoptimized={imageUrl.startsWith('data:')} 
              priority={false}
              loading="lazy"
            />
          ) : (
            <div className="relative w-full h-full">
               <video src={imageUrl} className="w-full h-full object-cover" muted loop playsInline autoPlay />
               <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded-full">
                  <Play className="h-3 w-3 text-white fill-current" />
               </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-800/50">
              <Logo className="h-16 w-16 mb-2 opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">SuguMali</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className={cn("font-bold text-white truncate text-sm", post.status === 'sold' && "text-muted-foreground")}>{title}</h3>
        
        {formattedPrice && (
            <p className={cn("text-orange-500 font-extrabold text-lg mt-1", post.status === 'sold' && "text-muted-foreground line-through")}>
              {formattedPrice} FCFA
            </p>
        )}
        
        <div className="flex items-center gap-1 mt-auto pt-3 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{location}</span>
        </div>
      </div>
    </Link>
  );
}
