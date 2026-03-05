'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnnoncesValidationTable() {
  return (
    <Card>
      <CardHeader><CardTitle>Validation des Annonces</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}