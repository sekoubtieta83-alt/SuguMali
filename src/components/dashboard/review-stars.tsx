import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStarsProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  showText?: boolean;
}

export function ReviewStars({ rating, totalStars = 5, size = 16, className, showText = false }: ReviewStarsProps) {
  const roundedRating = Math.round(rating);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'transition-colors',
              i < roundedRating ? 'text-accent fill-accent' : 'text-muted-foreground/30'
            )}
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      {showText && <span className="text-sm text-muted-foreground font-medium">{rating.toFixed(1)} sur {totalStars}</span>}
    </div>
  );
}
