
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ReviewStars } from '@/components/dashboard/review-stars';
import { Trash2, MessageSquare, User, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AdminReview {
  id: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  reviewerPhotoURL?: string;
  reviewerId: string;
  sellerId: string;
  annonceId: string;
  createdAt: any;
}

export function ReviewsModerationTable() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminReview));
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'reviews', id));
      toast({ title: "Avis supprimé" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de la suppression" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6">
        <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Modération des Avis
        </CardTitle>
        <CardDescription>
            Gérez les avis laissés par les utilisateurs. Les avis avec commentaires (1-2 étoiles) sont prioritaires.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="pl-6">Utilisateur</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-[40%]">Commentaire</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        Aucun avis pour le moment.
                    </TableCell>
                </TableRow>
            ) : reviews.map((review) => (
              <TableRow key={review.id} className="group hover:bg-muted/20 transition-colors">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={review.reviewerPhotoURL} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{review.reviewerName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">ID: {review.reviewerId.slice(0, 8)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ReviewStars rating={review.rating} size={12} />
                </TableCell>
                <TableCell>
                  {review.comment ? (
                    <div className="flex flex-col gap-1">
                        {review.rating <= 2 && <Badge variant="destructive" className="w-fit text-[8px] h-4">Alerte mécontentement</Badge>}
                        <p className="text-sm italic text-foreground/80 leading-relaxed bg-muted/30 p-2 rounded-lg border border-border/50">
                            "{review.comment}"
                        </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Pas de commentaire écrit (Note positive)</span>
                  )}
                </TableCell>
                <TableCell className="text-xs font-medium text-muted-foreground">
                  {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
