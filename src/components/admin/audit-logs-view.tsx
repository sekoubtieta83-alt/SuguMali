'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Loader2, User, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const logsRef = collection(firestore, 'auditLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [firestore]);

  const getActionColor = (action: string) => {
    if (action.includes('REJECT') || action.includes('BAN')) return 'destructive';
    if (action.includes('APPROVE') || action.includes('VERIFY')) return 'default';
    return 'secondary';
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Journal d'Activité
        </CardTitle>
        <CardDescription>Historique des actions administratives et événements système.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Action</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Cible / Détails</TableHead>
              <TableHead className="text-right pr-6">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-10 italic">Aucun événement enregistré.</TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="pl-6">
                  <Badge variant={getActionColor(log.action)} className="text-[10px] px-2 py-0.5 uppercase">
                    {log.action.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {log.userName || 'Système'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {log.targetName && <span className="text-xs font-black">{log.targetName}</span>}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-2 w-2" />
                      {log.details || 'Pas de détails'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6 text-[10px] font-medium text-muted-foreground">
                  {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd/MM HH:mm', { locale: fr }) : 'Inconnue'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
