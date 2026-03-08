import Image from 'next/image';
import type { Post } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, MapPin, Rocket, Play } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedPrice = post.isProduct && post.product 
    ? `${post.product.price.replace(/[^0-9,.]/g, '')} FCFA`
    : null;

  const title = post.isProduct && post.product?.name ? post.product.name : post.content;
  const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;

  return (
    <Link href={`/annonces/${post.id}`} className="group block bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border/50 overflow-hidden flex flex-col">
      <div className="relative h-48 bg-muted overflow-hidden">
        {post.isPromoted && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-primary/80 backdrop-blur-sm text-primary-foreground text-xs font-bold py-1 px-2 rounded-full shadow-lg">
                <Rocket className="h-3 w-3" />
                <span>Sponsorisé</span>
            </div>
        )}
        {firstMedia ? (
          firstMedia.type === 'image' ? (
            <Image 
              src={firstMedia.url} 
              alt={title}
              fill 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              data-ai-hint="product image"
            />
          ) : (
            <div className="relative w-full h-full">
               <video 
                src={firstMedia.url} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                muted 
                loop 
                playsInline 
                autoPlay 
              />
              <div className="absolute bottom-2 right-2 bg-black/50 p-1 rounded-full">
                <Play className="h-3 w-3 text-white fill-current" />
              </div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-card-foreground truncate" title={title}>{title}</h3>
        
        {formattedPrice && (
            <p className="text-accent font-extrabold text-xl mt-1">{formattedPrice}</p>
        )}
        
        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
          {post.location && (
            <>
              <MapPin className="h-4 w-4" />
              <span>{post.location}</span>
            </>
          )}
        </div>

        <div className="mt-auto pt-4">
            <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold rounded-xl border-none" tabIndex={-1}>
              Voir les détails
            </Button>
        </div>
      </div>
    </Link>
  );
}
