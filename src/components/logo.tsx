import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <style>
        {`
          @keyframes bag-bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-1.5px) scale(1.02); }
          }
          .bag-animate {
            animation: bag-bounce 2s ease-in-out infinite;
            transform-origin: center bottom;
          }
        `}
      </style>
      <defs>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(29, 100%, 60%)" />
          <stop offset="100%" stopColor="hsl(29, 100%, 45%)" />
        </linearGradient>
      </defs>

      {/* Socle arrondi orange */}
      <rect width="32" height="32" rx="10" fill="url(#orangeGradient)" />
      
      {/* Structure du Sac de Shopping - Blanc avec animation */}
      <g className="bag-animate">
        {/* Corps du sac */}
        <path
          d="M8 11.5L24 11.5L26.5 27C26.5 28.1 25.6 29 24.5 29H7.5C6.4 29 5.5 28.1 5.5 27L8 11.5Z"
          fill="white"
        />
        
        {/* Poignées (Handles) */}
        <path
          d="M12 11.5V9C12 6.8 13.8 5 16 5C18.2 5 20 6.8 20 9V11.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Ligne de détail pour la profondeur (plus discret) */}
        <path
          d="M8.5 14H23.5"
          stroke="hsl(29, 100%, 50%)"
          strokeWidth="0.5"
          strokeLinecap="round"
          opacity="0.2"
        />
      </g>
    </svg>
  );
}
