'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

interface MediaPlayerProps {
  url: string;
  type?: 'image' | 'video';
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * MediaPlayer : Un composant optimisé pour les médias Cloudinary et Firebase.
 * Gère le CORS, le format .mp4 et l'adaptation mobile.
 */
export function MediaPlayer({ url, type, className, alt, priority }: MediaPlayerProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Détection robuste du type
  const isVideo = type === 'video' || 
                  url.includes('/video/upload/') || 
                  url.match(/\.(mp4|webm|ogg|mov|quicktime)($|\?)/i);

  useEffect(() => {
    setStatus('loading');
    setRetryCount(0);
  }, [url]);

  const handleMediaError = () => {
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (videoRef.current) videoRef.current.load();
      }, 1500);
    } else {
      setStatus('error');
    }
  };

  if (status === 'error' || !url) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground p-4", className)}>
        <Logo className="h-12 w-12 mb-2 opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">SuguMali</span>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted", className)}>
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30 backdrop-blur-[2px]">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      )}

      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={url}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              status === 'ready' ? "opacity-100" : "opacity-0"
            )}
            muted
            loop
            playsInline
            autoPlay
            crossOrigin="anonymous"
            onCanPlay={() => setStatus('ready')}
            onError={handleMediaError}
          />
          {status === 'ready' && (
            <div className="absolute bottom-2 right-2 bg-black/40 p-1.5 rounded-full backdrop-blur-md">
              <Film className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      ) : (
        <img
          src={url}
          alt={alt || "Produit SuguMali"}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            status === 'ready' ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          crossOrigin="anonymous"
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setStatus('ready')}
          onError={handleMediaError}
        />
      )}
    </div>
  );
}