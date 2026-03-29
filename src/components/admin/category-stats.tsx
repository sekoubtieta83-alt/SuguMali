'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Loader2, Package } from 'lucide-react';

export function CategoryStats() {
  const [stats, setStats] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const annoncesRef = collection(firestore, 'annonces');
    
    const unsubscribe = onSnapshot(annoncesRef, (snapshot) => {
      const counts: any = {};
      snapshot.docs.forEach(doc => {
        const cat = doc.data().categorie || 'Autre';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      const data = Object.entries(counts)
        .map(([name, count]: any) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setStats(data);
      setTotal(snapshot.size);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [firestore]);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-accent" /></div>;

  return (
    <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Répartition par Catégorie
        </CardTitle>
        <CardDescription>Volume total : {total} annonces publiées.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {stats.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground italic">Aucune annonce disponible.</p>
          ) : stats.map((stat) => {
            const percentage = Math.round((stat.count / total) * 100);
            return (
              <div key={stat.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold flex items-center gap-2">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    {stat.name}
                  </span>
                  <span className="font-black text-primary">{stat.count} <span className="text-[10px] text-muted-foreground font-normal">({percentage}%)</span></span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
