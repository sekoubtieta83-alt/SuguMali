'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, MousePointerClick, Users, Flag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type UserProfile } from '@/app/dashboard/profile/page';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export function StatsCards() {
  const firestore = useFirestore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    
    // Listen to users
    const usersRef = collection(firestore, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: usersRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Listen to reports
    const reportsRef = collection(firestore, 'reports');
    const unsubscribeReports = onSnapshot(reportsRef, (snapshot) => {
      setReportsCount(snapshot.size);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: reportsRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    // Listen to site stats (Visits)
    const statsRef = doc(firestore, 'site_stats', 'counters');
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setTotalVisits(docSnap.data().visits || 0);
      } else {
        setTotalVisits(0);
      }
      setLoading(false);
    }, async (serverError) => {
      // Les stats peuvent être vides au début
      setTotalVisits(0);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
      unsubscribeStats();
    };
  }, [firestore]);

  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Visites totales</CardTitle>
          <div className="bg-primary/10 p-2 rounded-lg">
            <MousePointerClick className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {totalVisits === null ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-black">{totalVisits.toLocaleString()}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Nombre total de sessions</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Utilisateurs</CardTitle>
          <div className="bg-primary/10 p-2 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-black">{totalUsers.toLocaleString()}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Inscrits sur la plateforme</p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Certifiés</CardTitle>
          <div className="bg-accent/10 p-2 rounded-lg">
            <BadgeCheck className="h-4 w-4 text-accent fill-accent text-white" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-black">{verifiedUsers.toLocaleString()}</div>
          )}
          { !loading && totalUsers > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{Math.round((verifiedUsers / totalUsers) * 100)}% de taux de confiance</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Signalements</CardTitle>
          <div className="bg-destructive/10 p-2 rounded-lg">
            <Flag className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-black">{reportsCount.toLocaleString()}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">Annonces à modérer</p>
        </CardContent>
      </Card>
    </div>
  );
}
