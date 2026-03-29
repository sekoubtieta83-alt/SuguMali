'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SearchMetricsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const logsRef = collection(firestore, 'searchLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [firestore]);

  // Calculer les top recherches
  const topSearches = logs.reduce((acc: any, log: any) => {
    const q = log.query?.trim().toLowerCase();
    if (q) acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  const sortedTop = Object.entries(topSearches)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Recherches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sortedTop.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune donnée de recherche.</p>
              ) : sortedTop.map(([term, count]: any) => (
                <div key={term} className="flex items-center justify-between">
                  <span className="font-bold capitalize">{term}</span>
                  <span className="bg-muted px-2 py-1 rounded-lg text-xs font-black">{count} fois</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
              <Clock className="h-4 w-4 text-accent" />
              Dernières requêtes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[150px] font-medium italic">"{log.query}"</span>
                  <span className="text-[10px] text-muted-foreground">
                    {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm', { locale: fr }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Historique Complet
          </CardTitle>
          <CardDescription>Analyse en temps réel de ce que les maliens cherchent sur SuguMali.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Recherche</TableHead>
                <TableHead>Résultats</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">Aucun log trouvé.</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="pl-6 font-bold text-accent">{log.query}</TableCell>
                  <TableCell>{log.resultsCount || 0}</TableCell>
                  <TableCell className="text-xs font-mono">{log.userId?.slice(0, 8)}...</TableCell>
                  <TableCell className="text-right pr-6 text-xs text-muted-foreground">
                    {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd MMM HH:mm', { locale: fr }) : 'Inconnue'}
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
