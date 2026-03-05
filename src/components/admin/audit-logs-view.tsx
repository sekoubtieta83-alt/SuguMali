'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuditLogsView() {
  return (
    <Card>
      <CardHeader><CardTitle>Journal d'Activité</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground italic">Composant simplifié pour réduire la taille du projet.</p></CardContent>
    </Card>
  );
}