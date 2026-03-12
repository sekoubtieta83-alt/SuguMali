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

    // Animation du texte très rapide
    const textTimer = setTimeout(() => setShowText(true), 300);
    
    // Début de la disparition après 1.5s
    const fadeTimer = setTimeout(() => setStatus('fading'), 1500);
    
    // Suppression complète après 2s (fin de la transition)
    const hiddenTimer = setTimeout(() => {
      setStatus('hidden');
      document.body.style.overflow = 'unset';
    }, 2000);

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
      "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out",
      status === 'fading' ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Logo avec animation pulsée */}
          <div className="relative z-10 animate-in fade-in zoom-in duration-700">
            <Logo className="h-24 w-24 sm:h-32 sm:w-32 animate-pulse" />
          </div>
          {/* Lueur subtile orange sur fond blanc */}
          <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full animate-pulse -z-10" />
        </div>
        
        {/* Texte animé SuguMali */}
        <div className={cn(
          "transition-all duration-700 transform flex flex-col items-center gap-1",
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
            Sugu<span className="text-accent">Mali</span>
          </h1>
          <div className="h-1 w-8 bg-accent rounded-full animate-bounce mt-1" />
        </div>
      </div>
    </div>
  );
}
