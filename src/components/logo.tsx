import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Dégradé pour le socle orange pour garder un peu de profondeur */}
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(29, 100%, 60%)" />
          <stop offset="100%" stopColor="hsl(29, 100%, 45%)" />
        </linearGradient>
      </defs>

      {/* Socle arrondi orange */}
      <rect width="32" height="32" rx="10" fill="url(#orangeGradient)" />
      
      {/* Structure du chariot - Entièrement Blanche */}
      <g>
        {/* Cadre principal et poignée */}
        <path
          d="M6 8L8 8L9.5 19H23L25 10H11"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Support arrière et poignée supérieure */}
        <path
          d="M8 8L7 5H5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Roues blanches */}
        <circle cx="12" cy="25" r="2.5" fill="white" />
        <circle cx="21" cy="25" r="2.5" fill="white" />
        
        {/* Détail de brillance sur le cadre */}
        <path
          d="M10 10H24"
          stroke="white"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </g>
    </svg>
  );
}
