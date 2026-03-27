'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, Loader2, Rocket, Clock, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function PromotionsView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const reqRef = collection(firestore, 'promotion_requests');
    const q = query(reqRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: reqRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleAction = async (requestId: string, annonceId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    try {
      // 1. Mettre à jour le statut de la demande
      await updateDoc(doc(firestore, 'promotion_requests', requestId), { status });
      
      // 2. Si approuvé, marquer l'annonce comme promue
      if (status === 'approved') {
        await updateDoc(doc(firestore, 'annonces', annonceId), { isPromoted: true });
      }

      toast({ title: status === 'approved' ? "Promotion activée !" : "Demande rejetée" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors du traitement" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6">
        <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-accent" />
            Demandes de Promotion
        </CardTitle>
        <CardDescription>
            Validez les preuves de paiement (OM/Wave) pour activer le boost des annonces.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="pl-6">Utilisateur</TableHead>
              <TableHead>Annonce</TableHead>
              <TableHead>Preuve</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                        Aucune demande de promotion pour le moment.
                    </TableCell>
                </TableRow>
            ) : requests.map((r) => (
              <TableRow key={r.id} className="group hover:bg-muted/20 transition-colors">
                <TableCell className="pl-6 font-bold">{r.userName || 'Utilisateur'}</TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">{r.annonceTitle}</TableCell>
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Voir
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
                            <DialogHeader className="p-6 bg-muted">
                                <DialogTitle>Preuve de paiement - {r.userName}</DialogTitle>
                            </DialogHeader>
                            <div className="bg-black flex items-center justify-center max-h-[80vh] overflow-auto">
                                <img src={r.screenshotUrl} alt="Preuve" className="max-w-full h-auto" />
                            </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
                <TableCell>
                    <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="rounded-lg">
                        {r.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {r.status === 'approved' ? 'Active' : r.status === 'rejected' ? 'Refusée' : 'En attente'}
                    </Badge>
                </TableCell>
                <TableCell className="text-[10px] text-muted-foreground">
                    {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM HH:mm', { locale: fr }) : 'Inconnue'}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {r.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleAction(r.id, r.annonceId, 'approved')} className="bg-green-600 hover:bg-green-700 rounded-xl font-bold h-8 px-3">
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(r.id, r.annonceId, 'rejected')} className="rounded-xl font-bold h-8 px-3">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Traité</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}