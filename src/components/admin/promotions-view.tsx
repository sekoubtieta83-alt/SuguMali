'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PromotionsView() {
  return (
    <Card>
      <CardHeader><CardTitle>Suivi des Promotions</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}