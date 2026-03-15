
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserX, UserCheck, Shield, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type UserProfile } from '@/app/dashboard/profile/page';

export function UsersTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        isBanned: !currentStatus
      });
      toast({
        title: currentStatus ? "Utilisateur réhabilité" : "Utilisateur banni",
        variant: currentStatus ? "default" : "destructive"
      });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de l'action" });
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gestion des Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Certification</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback>{u.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold">{u.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground"><div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</div></TableCell>
                <TableCell>
                  {u.isBanned ? (
                    <Badge variant="destructive">Banni</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Actif</Badge>
                  )}
                </TableCell>
                <TableCell>
                    {u.isVerified ? (
                        <Badge className="bg-accent text-white">Certifié</Badge>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Non certifié</span>
                    )}
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={u.isBanned ? "text-green-600" : "text-destructive"}
                    onClick={() => toggleBan(u.uid, !!u.isBanned)}
                  >
                    {u.isBanned ? <UserCheck className="h-4 w-4 mr-2" /> : <UserX className="h-4 w-4 mr-2" />}
                    {u.isBanned ? "Réhabiliter" : "Bannir"}
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
