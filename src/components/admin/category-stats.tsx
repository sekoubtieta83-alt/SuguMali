'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CategoryStats() {
  return (
    <Card>
      <CardHeader><CardTitle>Statistiques par Catégorie</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}