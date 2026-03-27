'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Eye, Loader2, Rocket, Clock, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function PromotionsView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [duration, setDuration] = useState<string>('5');
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  
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

  const handleOpenApproval = (request: any) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!firestore || !selectedRequest) return;
    
    try {
      const requestId = selectedRequest.id;
      const annonceId = selectedRequest.annonceId;
      const days = parseInt(duration);

      // 1. Mettre à jour le statut de la demande
      const requestRef = doc(firestore, 'promotion_requests', requestId);
      await updateDoc(requestRef, { 
        status,
        durationDays: status === 'approved' ? days : null,
        processedAt: Timestamp.now()
      });
      
      // 2. Si approuvé, marquer l'annonce comme promue avec expiration
      if (status === 'approved') {
        const expiresAt = addDays(new Date(), days);
        const annonceRef = doc(firestore, 'annonces', annonceId);
        await updateDoc(annonceRef, { 
          isPromoted: true,
          promotionExpiresAt: Timestamp.fromDate(expiresAt)
        });
      }

      toast({ 
        title: status === 'approved' ? `Promotion activée pour ${days} jours !` : "Demande rejetée" 
      });
      
      setIsApprovalDialogOpen(false);
      setSelectedRequest(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Erreur lors du traitement" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6">
          <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-accent" />
              Demandes de Promotion
          </CardTitle>
          <CardDescription>
              Validez les preuves de paiement et choisissez la durée du boost.
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
                      {r.status === 'approved' && r.durationDays && (
                        <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarDays className="h-2 w-2" /> {r.durationDays} jours
                        </div>
                      )}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM HH:mm', { locale: fr }) : 'Inconnue'}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {r.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => handleOpenApproval(r)} className="bg-green-600 hover:bg-green-700 rounded-xl font-bold h-8 px-3">
                              <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(r); handleAction('rejected'); }} className="rounded-xl font-bold h-8 px-3">
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

      {/* Modal de choix de la durée */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-accent" />
              Approuver le boost
            </DialogTitle>
            <CardDescription>
              Choisissez la durée de visibilité prioritaire pour cette annonce (min. 5 jours).
            </CardDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Durée de la publicité</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-12 rounded-2xl border-2">
                  <SelectValue placeholder="Choisir une durée" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="5">5 Jours (Découverte)</SelectItem>
                  <SelectItem value="10">10 Jours (Standard)</SelectItem>
                  <SelectItem value="15">15 Jours (Premium)</SelectItem>
                  <SelectItem value="30">30 Jours (Mensuel)</SelectItem>
                  <SelectItem value="90">90 Jours (Pro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
              <p className="text-xs font-medium text-accent leading-relaxed">
                L'annonce apparaîtra en haut de liste et sera mise en avant dans le carrousel jusqu'au <strong>{format(addDays(new Date(), parseInt(duration)), 'dd MMMM yyyy', { locale: fr })}</strong>.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsApprovalDialogOpen(false)} className="rounded-xl font-bold">Annuler</Button>
            <Button onClick={() => handleAction('approved')} className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold px-8">
              Confirmer l'activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}