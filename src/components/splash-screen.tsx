'use client';

import { useState, useEffect } from 'react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [status, setStatus] = useState<'loading' | 'fading' | 'hidden'>('loading');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Bloquer le scroll pendant le chargement
    document.body.style.overflow = 'hidden';

    // Animation du texte après 0.8s
    const textTimer = setTimeout(() => setShowText(true), 800);
    
    // Début de la disparition après 3.5s
    const fadeTimer = setTimeout(() => setStatus('fading'), 3500);
    
    // Suppression complète après 4.5s (fin de la transition)
    const hiddenTimer = setTimeout(() => {
      setStatus('hidden');
      document.body.style.overflow = 'unset';
    }, 4500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hiddenTimer);
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (status === 'hidden') return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background transition-opacity duration-1000 ease-in-out",
      status === 'fading' ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          {/* Logo avec animation pulsée et lueur stylisée */}
          <div className="relative z-10 animate-in fade-in zoom-in duration-1000">
            <Logo className="h-28 w-28 sm:h-36 sm:w-36 animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse -z-10" />
        </div>
        
        {/* Texte animé SuguMali */}
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center gap-2",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground">
            Sugu<span className="text-accent">Mali</span>
          </h1>
          <div className="h-1 w-12 bg-accent rounded-full animate-bounce mt-2" />
        </div>
      </div>
    </div>
  );
}
