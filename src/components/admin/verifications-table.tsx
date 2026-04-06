'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Loader2, Eye, Check, X, ShieldCheck, Wallet, ImageIcon, Mail, ZoomIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function VerificationsTable() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('verificationStatus', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(data);
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: usersRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleAction = async (userId: string, status: 'verified' | 'rejected') => {
    if (!firestore) return;
    const userDoc = doc(firestore, 'users', userId);
    const updateData = {
      verificationStatus: status,
      isVerified: status === 'verified',
      verifiedAt: status === 'verified' ? serverTimestamp() : null
    };
    updateDoc(userDoc, updateData)
      .then(() => {
        toast({ title: status === 'verified' ? "Utilisateur certifié !" : "Certification refusée" });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDoc.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Vérifications d'Identité
        </CardTitle>
        <CardDescription>
            Gérez les demandes de badge orange (Certification SuguMali). Maintenez le clic sur une image pour zoomer.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Utilisateur</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="text-right pr-6">Décision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Aucune demande en attente.</TableCell></TableRow>
            ) : pendingUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/5 transition-colors">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shrink-0">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground truncate font-medium flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {u.isVerificationPaid ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px] rounded-lg">
                        <Wallet className="h-3 w-3 mr-1" /> Payé (5000)
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] rounded-lg">Non payé</Badge>
                  )}
                </TableCell>
                <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-lg font-bold h-8 text-[10px]">
                                  <Eye className="h-3.5 w-3.5 mr-1" /> Voir l'ID
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[95vw] rounded-3xl overflow-hidden p-0 border-none">
                              <DialogHeader className="p-4 bg-muted/50 border-b">
                                <div className="flex items-center justify-between pr-8">
                                    <DialogTitle>Pièce d'identité - {u.displayName}</DialogTitle>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        <ZoomIn className="h-3 w-3" /> Cliquer pour zoomer
                                    </div>
                                </div>
                                <DialogDescription className="sr-only">Visualisation de la pièce d'identité.</DialogDescription>
                              </DialogHeader>
                              <div className="bg-muted flex items-center justify-center p-4 overflow-auto max-h-[85vh]">
                                  <img 
                                    src={u.idDocumentUrl} 
                                    alt="ID" 
                                    className="w-full h-auto object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105 active:scale-[2] origin-center rounded-xl shadow-lg" 
                                  />
                              </div>
                          </DialogContent>
                      </Dialog>

                      {u.paymentScreenshotUrl && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" className="rounded-lg font-bold h-8 text-[10px] bg-accent/10 text-accent hover:bg-accent/20">
                                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Reçu
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl w-[95vw] rounded-3xl overflow-hidden p-0 border-none">
                                <DialogHeader className="p-4 bg-muted/50 border-b">
                                  <div className="flex items-center justify-between pr-8">
                                    <DialogTitle>Preuve de paiement</DialogTitle>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        <ZoomIn className="h-3 w-3" /> Cliquer pour zoomer
                                    </div>
                                  </div>
                                  <DialogDescription className="sr-only">Visualisation du reçu.</DialogDescription>
                                </DialogHeader>
                                <div className="bg-muted flex items-center justify-center p-4 overflow-auto max-h-[85vh]">
                                    <img 
                                        src={u.paymentScreenshotUrl} 
                                        alt="Reçu" 
                                        className="w-full h-auto object-contain cursor-zoom-in transition-transform duration-300 hover:scale-105 active:scale-[2.5] origin-top rounded-xl shadow-lg" 
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                      )}
                    </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => handleAction(u.id, 'verified')} className="bg-accent text-white hover:bg-accent/90 rounded-lg font-bold h-8 px-4">
                        <Check className="h-4 w-4 mr-1" /> Valider
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAction(u.id, 'rejected')} className="text-destructive hover:bg-destructive/10 rounded-lg font-bold h-8 px-4">
                        <X className="h-4 w-4 mr-1" /> Refuser
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
