'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SearchMetricsView() {
  return (
    <Card>
      <CardHeader><CardTitle>Analyse de la Demande</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}