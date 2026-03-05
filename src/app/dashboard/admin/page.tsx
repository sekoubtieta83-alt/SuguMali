
'use client';

import { StatsCards } from '@/components/admin/stats-cards';
import { UsersTable } from '@/components/admin/users-table';
import { ReportsTable } from '@/components/admin/reports-table';
import { PromotionsView } from '@/components/admin/promotions-view';
import { AuditLogsView } from '@/components/admin/audit-logs-view';
import { AnnoncesValidationTable } from '@/components/admin/annonces-validation-table';
import { VerificationsTable } from '@/components/admin/verifications-table';
import { ReviewsModerationTable } from '@/components/admin/reviews-moderation-table';
import { CategoryStats } from '@/components/admin/category-stats';
import { SearchMetricsView } from '@/components/admin/search-metrics-view';
import { Shield, Users, Flag, Rocket, History, CheckSquare, ShieldCheck, MessageSquare, BarChart3, Search } from 'lucide-react';
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

      <div className="mt-10">
        <Tabs defaultValue="users" className="w-full">
            <TabsList className="flex flex-wrap items-center justify-start w-full max-w-7xl mb-10 bg-muted/50 p-2 rounded-2xl h-auto gap-4 border border-border/50">
                <TabsTrigger value="users" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <Users className="h-4 w-4 mr-2 hidden lg:inline" />
                    Utilisateurs
                </TabsTrigger>
                <TabsTrigger value="verifications" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <ShieldCheck className="h-4 w-4 mr-2 hidden lg:inline" />
                    Certification
                </TabsTrigger>
                <TabsTrigger value="validation" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <CheckSquare className="h-4 w-4 mr-2 hidden lg:inline" />
                    Annonces
                </TabsTrigger>
                <TabsTrigger value="demands" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <Search className="h-4 w-4 mr-2 hidden lg:inline" />
                    Demande
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <BarChart3 className="h-4 w-4 mr-2 hidden lg:inline" />
                    Stats
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <MessageSquare className="h-4 w-4 mr-2 hidden lg:inline" />
                    Avis
                </TabsTrigger>
                <TabsTrigger value="reports" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <Flag className="h-4 w-4 mr-2 hidden lg:inline" />
                    Signalement
                </TabsTrigger>
                <TabsTrigger value="promotions" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <Rocket className="h-4 w-4 mr-2 hidden lg:inline" />
                    Promos
                </TabsTrigger>
                <TabsTrigger value="logs" className="rounded-xl font-bold data-[state=active]:shadow-md data-[state=active]:bg-background text-xs md:text-sm px-6 py-3 transition-all">
                    <History className="h-4 w-4 mr-2 hidden lg:inline" />
                    Journal
                </TabsTrigger>
            </TabsList>
            
            <div className="mt-10">
                <TabsContent value="users" className="mt-0 focus-visible:outline-none">
                    <UsersTable />
                </TabsContent>
                <TabsContent value="verifications" className="mt-0 focus-visible:outline-none">
                    <VerificationsTable />
                </TabsContent>
                <TabsContent value="validation" className="mt-0 focus-visible:outline-none">
                    <AnnoncesValidationTable />
                </TabsContent>
                <TabsContent value="demands" className="mt-0 focus-visible:outline-none">
                    <SearchMetricsView />
                </TabsContent>
                <TabsContent value="stats" className="mt-0 focus-visible:outline-none">
                    <CategoryStats />
                </TabsContent>
                <TabsContent value="reviews" className="mt-0 focus-visible:outline-none">
                    <ReviewsModerationTable />
                </TabsContent>
                <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
                    <ReportsTable />
                </TabsContent>
                <TabsContent value="promotions" className="mt-0 focus-visible:outline-none">
                    <PromotionsView />
                </TabsContent>
                <TabsContent value="logs" className="mt-0 focus-visible:outline-none">
                    <AuditLogsView />
                </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  );
}
