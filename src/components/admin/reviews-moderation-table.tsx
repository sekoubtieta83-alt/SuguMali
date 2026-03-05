'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReviewsModerationTable() {
  return (
    <Card>
      <CardHeader><CardTitle>Modération des Avis</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}