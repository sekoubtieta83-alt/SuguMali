
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Veuillez sélectionner une note." }),
  comment: z.string().optional().refine((val) => {
    // Si la note est <= 2, le commentaire est obligatoire
    return true; // Géré dynamiquement dans le schéma si besoin, mais on va utiliser superRefine ou validation manuelle
  }),
}).superRefine((data, ctx) => {
  if (data.rating <= 2 && (!data.comment || data.comment.length < 10)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Un avis de 1 ou 2 étoiles nécessite une explication d'au moins 10 caractères.",
      path: ["comment"],
    });
  }
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

  const rating = form.watch('rating');
  const needsComment = rating > 0 && rating <= 2;

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
        rating: data.rating,
        comment: data.comment || '',
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="text-center">
              <FormLabel className="text-base font-bold">Votre note</FormLabel>
              <FormControl>
                <div className="flex items-center justify-center gap-2 py-4" onMouseLeave={() => setHoverRating(0)}>
                    {[...Array(5)].map((_, index) => {
                        const starValue = index + 1;
                        return (
                            <button
                                type="button"
                                key={starValue}
                                onMouseEnter={() => setHoverRating(starValue)}
                                onClick={() => field.onChange(starValue)}
                                className="focus:outline-none transition-transform active:scale-90"
                            >
                                <Star
                                    className={cn(
                                        "h-10 w-10 cursor-pointer transition-all duration-200",
                                        starValue <= (hoverRating || rating) ? 'text-accent fill-accent scale-110' : 'text-muted-foreground/30'
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

        {needsComment && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
             <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-accent" />
                        <FormLabel className="font-bold">Pourquoi cette note ?</FormLabel>
                    </div>
                    <FormDescription className="text-[10px] mb-2">
                        Une note de 1 ou 2 étoiles nécessite une explication pour nous aider à améliorer SuguMali.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Dites-nous ce qui ne s'est pas bien passé..."
                        className="resize-none min-h-[120px] rounded-xl border-accent/20 focus:border-accent"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
        )}

        {rating > 2 && (
             <p className="text-center text-xs text-muted-foreground italic">
                Merci ! Les notes de 3 étoiles et plus ne nécessitent pas de commentaire écrit.
             </p>
        )}

        <Button 
            type="submit" 
            className="w-full h-12 rounded-xl font-black text-base shadow-lg shadow-accent/20" 
            disabled={isLoading || rating === 0}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Valider mon avis'}
        </Button>
      </form>
    </Form>
  );
}
