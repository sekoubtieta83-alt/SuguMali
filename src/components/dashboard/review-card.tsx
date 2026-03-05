import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReviewStars } from './review-stars';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// This type should align with the Firestore structure
export type Review = {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  sellerId: string;
  annonceId: string;
  rating: number;
  comment: string;
  createdAt: { seconds: number; nanoseconds: number; } | Date; // Firestore timestamp or Date object
};


export function ReviewCard({ review }: { review: Review }) {
  const reviewDate = review.createdAt instanceof Date 
    ? review.createdAt 
    : new Date(review.createdAt.seconds * 1000);

  return (
    <Card className="bg-muted/50 border-none shadow-none">
      <CardHeader className="flex-row items-start gap-4 p-4 pb-2">
        <Avatar>
          <AvatarImage src={review.reviewerPhotoURL} alt={review.reviewerName} />
          <AvatarFallback>{review.reviewerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-bold">{review.reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(reviewDate, { addSuffix: true, locale: fr })}
            </p>
          </div>
          <ReviewStars rating={review.rating} size={14} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">{review.comment}</p>
      </CardContent>
    </Card>
  );
}
