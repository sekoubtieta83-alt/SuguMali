
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Flag, Loader2, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

export function ReportsTable() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleDeleteReport = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'reports', id));
      toast({ title: "Signalement traité" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Signalements d'Annonces
        </CardTitle>
        <CardDescription>
            Annonces signalées par la communauté pour non-conformité.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Raison</TableHead>
              <TableHead>Annonce ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">Aucun signalement en attente.</TableCell></TableRow>
            ) : reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="font-bold">{r.reason}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <Link href={`/annonces/${r.annonceId}`} target="_blank" className="flex items-center gap-1 text-accent hover:underline">
                    {r.annonceId.slice(0, 12)}... <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                    {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM HH:mm', { locale: fr }) : 'Inconnue'}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteReport(r.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
