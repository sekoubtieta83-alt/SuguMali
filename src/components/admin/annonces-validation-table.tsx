
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function AnnoncesValidationTable() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    // On surveille les annonces en attente ou celles qui ont demandé une revue manuelle
    const q = query(collection(firestore, 'annonces'), where('status', 'in', ['pending', 'rejected']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnonces(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleApprove = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'annonces', id), {
        status: 'approved',
        manualReviewRequested: false,
        moderationReason: ""
      });
      toast({ title: "Annonce approuvée" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur d'approbation" });
    }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
    const reason = prompt("Raison du rejet :");
    if (reason === null) return;
    try {
      await updateDoc(doc(firestore, 'annonces', id), {
        status: 'rejected',
        moderationReason: reason || "Non conforme aux règles."
      });
      toast({ title: "Annonce rejetée" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur de rejet" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Modération des Annonces
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Article</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Vendeur ID</TableHead>
              <TableHead>Statut Actuel</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {annonces.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">Aucune annonce en attente de modération.</TableCell></TableRow>
            ) : annonces.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <img src={ad.image} alt="" className="h-10 w-10 object-cover rounded-lg border" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm truncate max-w-[200px]">{ad.titre}</span>
                        <Link href={`/annonces/${ad.id}`} target="_blank" className="text-[10px] text-accent flex items-center gap-1">Voir l'annonce <ExternalLink className="h-2 w-2" /></Link>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-primary">{ad.prix}</TableCell>
                <TableCell className="text-xs font-mono">{ad.vendeurId.slice(0, 8)}...</TableCell>
                <TableCell>
                    <Badge variant={ad.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {ad.manualReviewRequested ? '🔥 Manuel' : ad.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleApprove(ad.id)} className="text-green-600 border-green-200 hover:bg-green-50 rounded-xl">
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReject(ad.id)} className="text-destructive border-destructive/20 hover:bg-destructive/5 rounded-xl">
                        <XCircle className="h-4 w-4" />
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
