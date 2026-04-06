'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, Loader2, CheckCircle2, Users, DatabaseZap, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MaintenanceView() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleRepair = async () => {
    setLoading(true);
    setResult(null);
    try {
      const functions = getFunctions(getApp(), 'europe-west1');
      const repairFn = httpsCallable(functions, 'repairGhostUsers');
      const response = await repairFn();
      const data = response.data as any;
      
      setResult(data);
      toast({ 
        title: "Migration terminée", 
        description: `${data.repaired} profils Firestore ont été synchronisés avec l'Auth.` 
      });
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: 'destructive', 
        title: "Échec de la maintenance", 
        description: error.message || "Vous n'avez pas les droits ou une erreur serveur est survenue."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetVisits = async () => {
    if (!firestore || !confirm("Voulez-vous vraiment réinitialiser le compteur de visites à zéro ? Cette action est irréversible.")) return;
    
    try {
      const statsRef = doc(firestore, 'site_stats', 'counters');
      await updateDoc(statsRef, { visits: 0 });
      toast({ title: "Compteur réinitialisé", description: "Les statistiques repartent à zéro." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur lors de la réinitialisation" });
    }
  };

  const handleMarkAsAdminDevice = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAdminDevice', 'true');
      toast({ 
        title: "Appareil marqué !", 
        description: "Vos visites sur ce navigateur ne seront plus comptabilisées dans les stats." 
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Outils de Maintenance SuguMali
          </CardTitle>
          <CardDescription>Actions de nettoyage et synchronisation de la base de données.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          
          {/* Section Migration */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-accent/5 rounded-2xl border border-accent/10 relative overflow-hidden">
            <DatabaseZap className="absolute -right-4 -bottom-4 h-24 w-24 text-accent/5 -rotate-12" />
            <div className="space-y-2 relative z-10 text-center md:text-left">
              <h3 className="font-black text-lg flex items-center gap-2 justify-center md:justify-start">
                <Users className="h-5 w-5 text-accent" />
                Migration des Profils
              </h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Synchronise les comptes Auth avec Firestore pour supprimer le nom "Vendeur SuguMali".
              </p>
            </div>
            <Button onClick={handleRepair} disabled={loading} className="bg-accent hover:bg-accent/90 text-white font-black rounded-xl h-14 px-8 min-w-[220px] shadow-xl shadow-accent/20 z-10">
              {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <DatabaseZap className="h-5 w-5 mr-2" />}
              Lancer la migration
            </Button>
          </div>

          {/* Section Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Nettoyage Stats
                </h3>
                <p className="text-xs text-muted-foreground">Réinitialisez le compteur total de visites du site.</p>
              </div>
              <Button variant="outline" onClick={handleResetVisits} className="border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl h-12">
                Remettre à zéro
              </Button>
            </div>

            <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  Mode Discret Admin
                </h3>
                <p className="text-xs text-muted-foreground">Ne comptez plus vos propres visites sur ce navigateur.</p>
              </div>
              <Button variant="outline" onClick={handleMarkAsAdminDevice} className="border-green-200 text-green-700 hover:bg-green-50 font-bold rounded-xl h-12">
                Exclure cet appareil
              </Button>
            </div>
          </div>

          {result && (
            <div className="animate-in fade-in slide-in-from-top-4 p-6 bg-green-500/5 rounded-2xl border border-green-500/10 space-y-6">
              <div className="flex items-center gap-2 text-green-600 font-black uppercase tracking-[0.2em] text-[10px]">
                <CheckCircle2 className="h-4 w-4" /> Rapport de migration
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-2xl border border-border/50 text-center">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Scannés</span>
                  <span className="text-2xl font-black">{result.scanned}</span>
                </div>
                <div className="p-4 bg-background rounded-2xl border-2 border-green-200 text-center">
                  <span className="text-[9px] font-black text-green-600 uppercase block">Réparés</span>
                  <span className="text-2xl font-black text-green-600">{result.repaired}</span>
                </div>
                <div className="p-4 bg-background rounded-2xl border border-border/50 text-center">
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Erreurs</span>
                  <span className="text-2xl font-black text-destructive">{result.errors || 0}</span>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
