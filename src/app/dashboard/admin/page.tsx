'use client';

import { StatsCards } from '@/components/admin/stats-cards';
import { UsersTable } from '@/components/admin/users-table';
import { ReportsTable } from '@/components/admin/reports-table';
import { PromotionsView } from '@/components/admin/promotions-view';
import { AuditLogsView } from '@/components/admin/audit-logs-view';
import { AnnoncesValidationTable } from '@/components/admin/annonces-validation-table';
import { AllAnnoncesTable } from '@/components/admin/all-annonces-table';
import { VerificationsTable } from '@/components/admin/verifications-table';
import { ReviewsModerationTable } from '@/components/admin/reviews-moderation-table';
import { CategoryStats } from '@/components/admin/category-stats';
import { SearchMetricsView } from '@/components/admin/search-metrics-view';
import { Shield, Users, Flag, Rocket, History, CheckSquare, ShieldCheck, MessageSquare, BarChart3, Search, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-secondary/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary p-2 rounded-xl">
            <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-black text-2xl md:text-3xl tracking-tight">Tableau de bord Admin</h1>
      </div>

      <StatsCards />

      <div className="mt-6 md:mt-10">
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="flex flex-wrap items-center justify-start w-full max-w-7xl mb-6 md:mb-10 bg-muted/50 p-1.5 md:p-2 rounded-2xl h-auto gap-2 md:gap-4 border border-border/50">
                <TabsTrigger value="users" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <Users className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Utilisateurs
                </TabsTrigger>
                <TabsTrigger value="verifications" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Certification
                </TabsTrigger>
                <TabsTrigger value="validation" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <CheckSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Validation
                </TabsTrigger>
                <TabsTrigger value="gestion" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Gestion
                </TabsTrigger>
                <TabsTrigger value="demands" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <Search className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Demande
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Stats
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Avis
                </TabsTrigger>
                <TabsTrigger value="reports" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <Flag className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Signalement
                </TabsTrigger>
                <TabsTrigger value="promotions" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <Rocket className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Promos
                </TabsTrigger>
                <TabsTrigger value="logs" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-[10px] md:text-sm px-3 md:px-6 py-2 md:py-3 transition-all">
                    <History className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 hidden sm:inline" />
                    Journal
                </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 md:mt-10">
                <TabsContent value="users" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <UsersTable />
                </TabsContent>
                <TabsContent value="verifications" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <VerificationsTable />
                </TabsContent>
                <TabsContent value="validation" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <AnnoncesValidationTable />
                </TabsContent>
                <TabsContent value="gestion" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <AllAnnoncesTable />
                </TabsContent>
                <TabsContent value="demands" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <SearchMetricsView />
                </TabsContent>
                <TabsContent value="stats" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <CategoryStats />
                </TabsContent>
                <TabsContent value="reviews" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <ReviewsModerationTable />
                </TabsContent>
                <TabsContent value="reports" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <ReportsTable />
                </TabsContent>
                <TabsContent value="promotions" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <PromotionsView />
                </TabsContent>
                <TabsContent value="logs" className="mt-0 focus-visible:outline-none overflow-hidden">
                    <AuditLogsView />
                </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  );
}
