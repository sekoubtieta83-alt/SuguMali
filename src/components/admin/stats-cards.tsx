
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  
  // Mock data for visits
  const totalVisits = '12,405';

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
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: reportsRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
    };
  }, [firestore]);

  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visites totales</CardTitle>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVisits}</div>
          <p className="text-xs text-muted-foreground">+5.2% depuis le mois dernier</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{totalUsers}</div>
          )}
          <p className="text-xs text-muted-foreground">Inscrits sur la plateforme</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profils vérifiés</CardTitle>
          <BadgeCheck className="h-4 w-4 fill-accent text-white" />
        </CardHeader>
        <CardContent>
          {loading ? (
             <Skeleton className="h-7 w-1/4 mb-1" />
          ) : (
            <div className="text-2xl font-bold">{verifiedUsers}</div>
          )}
          { !loading && totalUsers > 0 && (
            <p className="text-xs text-muted-foreground">{Math.round((verifiedUsers / totalUsers) * 100)}% vérifiés</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signalements</CardTitle>
          <Flag className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          {loading ? (
             <Skeleton className="h-7 w-1/4 mb-1" />
          ) : (
            <div className="text-2xl font-bold">{reportsCount}</div>
          )}
          <p className="text-xs text-muted-foreground">Annonces à vérifier</p>
        </CardContent>
      </Card>
    </div>
  );
}
