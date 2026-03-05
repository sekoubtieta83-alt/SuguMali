'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Veuillez sélectionner une note." }),
  comment: z.string().min(10, { message: "Votre commentaire doit contenir au moins 10 caractères." }).max(500),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface AddReviewFormProps {
  sellerId: string;
  annonceId: string;
  onFinished: () => void;
}

export function AddReviewForm({ sellerId, annonceId, onFinished }: AddReviewFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: "Vous n'êtes pas connecté." });
        return;
    }
    if (user.uid === sellerId) {
        toast({ variant: 'destructive', title: "Vous ne pouvez pas évaluer votre propre annonce." });
        return;
    }
    setIsLoading(true);

    const reviewsCollection = collection(firestore, 'reviews');
    const newReviewData = {
        ...data,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Utilisateur anonyme',
        reviewerPhotoURL: user.photoURL || '',
        sellerId,
        annonceId,
        createdAt: serverTimestamp(),
      };

    addDoc(reviewsCollection, newReviewData)
    .then(() => {
        toast({ title: "Merci pour votre avis !" });
        onFinished();
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: reviewsCollection.path,
            operation: 'create',
            requestResourceData: newReviewData,
        });
        errorEmitter.emit('permission-error', permissionError);
    })
    .finally(() => {
        setIsLoading(false);
    });
  };
  
  const rating = form.watch('rating');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre note</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[...Array(5)].map((_, index) => {
                        const starValue = index + 1;
                        return (
                            <button
                                type="button"
                                key={starValue}
                                onMouseEnter={() => setHoverRating(starValue)}
                                onClick={() => field.onChange(starValue)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 cursor-pointer transition-colors",
                                        starValue <= (hoverRating || rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'
                                    )}
                                />
                            </button>
                        )
                    })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre commentaire</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Partagez votre expérience avec ce vendeur..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Soumettre mon avis'}
        </Button>
      </form>
    </Form>
  );
}
