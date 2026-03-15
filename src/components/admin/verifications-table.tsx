
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Loader2, Eye, Check, X, ShieldCheck, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function VerificationsTable() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'users'), where('verificationStatus', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleAction = async (userId: string, status: 'verified' | 'rejected') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        verificationStatus: status,
        isVerified: status === 'verified',
        verifiedAt: status === 'verified' ? serverTimestamp() : null
      });
      toast({ title: status === 'verified' ? "Utilisateur certifié !" : "Certification refusée" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de la mise à jour" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Vérifications d'Identité
        </CardTitle>
        <CardDescription>
            Gérez les demandes de badge orange (Certification SuguMali).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Utilisateur</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Document</TableHead>
              <TableHead className="text-right pr-6">Décision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Aucune demande de certification en attente.</TableCell></TableRow>
            ) : pendingUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">{u.displayName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {u.isVerificationPaid ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        <Wallet className="h-3 w-3 mr-1" /> Payé (5000)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Non payé</Badge>
                  )}
                </TableCell>
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl font-bold">
                                <Eye className="h-4 w-4 mr-2" /> Voir l'ID
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader><DialogTitle>Document d'identité - {u.displayName}</DialogTitle></DialogHeader>
                            <div className="bg-muted rounded-2xl overflow-hidden border">
                                <img src={u.idDocumentUrl} alt="Pièce d'identité" className="w-full h-auto object-contain max-h-[70vh]" />
                            </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => handleAction(u.id, 'verified')} className="bg-accent text-white hover:bg-accent/90 rounded-xl font-bold">
                        <Check className="h-4 w-4 mr-1" /> Valider
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleAction(u.id, 'rejected')} className="text-destructive hover:bg-destructive/10 rounded-xl font-bold">
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
