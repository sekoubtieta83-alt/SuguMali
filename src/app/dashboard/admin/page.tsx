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
import { Users, ShieldCheck, CheckSquare, Settings, Rocket, BarChart3, MessageSquare, Flag, Search, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 bg-[#0B0E14]">
      {/* Barre de Stats Supérieure */}
      <StatsCards />

      <div className="mt-4">
        <Tabs defaultValue="users" className="w-full">
            {/* Barre d'onglets style Image */}
            <TabsList className="bg-transparent flex flex-wrap h-auto gap-3 justify-start p-0 mb-8">
                <TabsTrigger value="users" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <Users className="h-4 w-4" />
                    Utilisateurs
                </TabsTrigger>
                <TabsTrigger value="verifications" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <ShieldCheck className="h-4 w-4" />
                    Certification
                </TabsTrigger>
                <TabsTrigger value="validation" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <CheckSquare className="h-4 w-4" />
                    Validation
                </TabsTrigger>
                <TabsTrigger value="gestion" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <Settings className="h-4 w-4" />
                    Gestion
                </TabsTrigger>
                <TabsTrigger value="promotions" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <Search className="h-4 w-4" />
                    Demande
                </TabsTrigger>
                <TabsTrigger value="stats" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <BarChart3 className="h-4 w-4" />
                    Stats
                </TabsTrigger>
                <TabsTrigger value="reviews" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <MessageSquare className="h-4 w-4" />
                    Avis
                </TabsTrigger>
                <TabsTrigger value="reports" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <Flag className="h-4 w-4" />
                    Signalement
                </TabsTrigger>
                <TabsTrigger value="search" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <Rocket className="h-4 w-4" />
                    Promos
                </TabsTrigger>
                <TabsTrigger value="logs" className="bg-[#161B22] text-[#8B949E] data-[state=active]:bg-white data-[state=active]:text-black rounded-xl px-6 py-2.5 font-bold flex items-center gap-2 border-none transition-all">
                    <History className="h-4 w-4" />
                    Journal
                </TabsTrigger>
            </TabsList>
            
            <div className="bg-[#0D1117] rounded-[2rem] border border-[#30363D]/30 p-6 min-h-[600px] shadow-2xl">
                <TabsContent value="users" className="m-0 border-none outline-none">
                    <UsersTable />
                </TabsContent>
                <TabsContent value="verifications" className="m-0 border-none outline-none">
                    <VerificationsTable />
                </TabsContent>
                <TabsContent value="validation" className="m-0 border-none outline-none">
                    <AnnoncesValidationTable />
                </TabsContent>
                <TabsContent value="gestion" className="m-0 border-none outline-none">
                    <AllAnnoncesTable />
                </TabsContent>
                <TabsContent value="promotions" className="m-0 border-none outline-none">
                    <PromotionsView />
                </TabsContent>
                <TabsContent value="stats" className="m-0 border-none outline-none">
                    <CategoryStats />
                </TabsContent>
                <TabsContent value="reviews" className="m-0 border-none outline-none">
                    <ReviewsModerationTable />
                </TabsContent>
                <TabsContent value="reports" className="m-0 border-none outline-none">
                    <ReportsTable />
                </TabsContent>
                <TabsContent value="search" className="m-0 border-none outline-none">
                    <SearchMetricsView />
                </TabsContent>
                <TabsContent value="logs" className="m-0 border-none outline-none">
                    <AuditLogsView />
                </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  );
}
