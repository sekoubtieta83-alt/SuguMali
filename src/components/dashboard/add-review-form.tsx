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
import { Loader2, Star, AlertCircle, MessageSquareWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Veuillez sélectionner une note." }),
  comment: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.rating <= 2 && (!data.comment || data.comment.length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Un avis de 1 ou 2 étoiles nécessite une courte explication.",
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
        <div className="bg-muted/30 p-6 rounded-3xl border border-border/50 text-center space-y-4">
          <FormLabel className="text-lg font-black block">Comment s'est passée la vente ?</FormLabel>
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center justify-center gap-1 sm:gap-2 py-2" onMouseLeave={() => setHoverRating(0)}>
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
                                          "h-10 w-10 sm:h-12 sm:w-12 cursor-pointer transition-all duration-200",
                                          starValue <= (hoverRating || rating) ? 'text-accent fill-accent scale-110 drop-shadow-md' : 'text-muted-foreground/20'
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
        </div>

        {needsComment && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-destructive/5 p-5 rounded-3xl border border-destructive/10">
             <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquareWarning className="h-5 w-5 text-destructive" />
                        <FormLabel className="font-black text-sm">Dites-nous en plus</FormLabel>
                    </div>
                    <FormDescription className="text-[11px] mb-3 leading-tight opacity-70">
                        Votre note est basse. Aidez-nous à sécuriser SuguMali en expliquant brièvement le problème rencontré avec ce vendeur.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Produit non conforme, vendeur désagréable..."
                        className="resize-none min-h-[100px] rounded-2xl bg-background border-border/50 focus:border-destructive/50 focus:ring-destructive/20"
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
             <div className="text-center py-4 px-6 bg-green-500/5 rounded-2xl border border-green-500/10">
                <p className="text-xs text-green-600 font-bold italic">
                   ✨ Note positive ! Pas besoin de commentaire, votre avis sera validé tel quel.
                </p>
             </div>
        )}

        <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-accent/20 transition-all active:scale-95" 
            disabled={isLoading || rating === 0}
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Envoyer mon avis'}
        </Button>
      </form>
    </Form>
  );
}
