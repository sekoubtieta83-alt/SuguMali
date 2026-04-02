'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Trash2, ExternalLink, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function AllAnnoncesTable() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const annoncesRef = collection(firestore, 'annonces');
    const q = query(annoncesRef, orderBy('createdAt', 'desc'), limit(200));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnonces(data);
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: annoncesRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleDelete = async (id: string) => {
    if (!firestore || !confirm("Voulez-vous vraiment supprimer DEFINITIVEMENT cette annonce ? Cette action est irréversible.")) return;
    
    const adRef = doc(firestore, 'annonces', id);
    deleteDoc(adRef)
      .then(() => {
        toast({ title: "Annonce supprimée" });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: adRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const filtered = annonces.filter(ad => 
    ad.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ad.id.includes(searchQuery) ||
    ad.vendeurId.includes(searchQuery)
  );

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-card p-4 rounded-2xl border shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Rechercher par titre, ID annonce ou ID vendeur..." 
          className="border-none bg-transparent focus-visible:ring-0 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Gestion Globale des Annonces
          </CardTitle>
          <CardDescription>Liste de toutes les annonces publiées sur SuguMali ({annonces.length}).</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Article</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 italic">Aucune annonce trouvée.</TableCell></TableRow>
              ) : filtered.map((ad) => (
                <TableRow key={ad.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      {ad.media && ad.media[0] ? (
                        <img src={ad.media[0].url} alt="" className="h-10 w-10 object-cover rounded-lg border shadow-sm" />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded-lg border flex items-center justify-center text-[8px] text-muted-foreground">NO IMG</div>
                      )}
                      <div className="flex flex-col max-w-[200px]">
                        <span className="font-bold text-sm truncate">{ad.titre}</span>
                        <Link href={`/annonces/${ad.id}`} target="_blank" className="text-[10px] text-accent flex items-center gap-1 hover:underline">
                          ID: {ad.id.slice(0, 12)}... <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.status === 'approved' ? 'default' : ad.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {ad.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono text-muted-foreground">Vendeur: {ad.vendeurId.slice(0, 8)}...</span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(ad.id)} 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}