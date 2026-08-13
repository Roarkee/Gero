import React from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import TodaysFocus from "../components/TodaysFocus";
import KpiGrid from "../components/KpiGrid";
import NeedsAttention from "../components/NeedsAttention";
import FinancialCharts from "../components/FinancialCharts";
import ProjectHealthTable from "../components/ProjectHealthTable";
import RecentActivityFeed from "../components/RecentActivityFeed";

// Simple Skeleton Loader
const DashboardSkeleton = () => (
  <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-xl w-full"></div>
      ))}
    </div>
    <div className="h-96 bg-gray-200 rounded-xl w-full"></div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          Failed to load dashboard data. Please try refreshing.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/ai-history"
            className="btn-neon flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 border border-primary-400/30 rounded-lg text-sm font-medium text-white hover:from-primary-500 hover:to-secondary-500 transition-all duration-300 shadow-neon-purple hover:scale-105"
          >
            <Sparkles className="w-4 h-4 animate-pulse-glow" /> AI Workflow
          </Link>
          <Link
            to="/clients"
            className="group flex items-center gap-1.5 px-4 py-2 bg-dark-card backdrop-blur-md border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all shadow-glass"
          >
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary-400" /> Client
          </Link>
          <Link
            to="/projects"
            className="group flex items-center gap-1.5 px-4 py-2 bg-dark-card backdrop-blur-md border border-white/10 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all shadow-glass"
          >
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary-400" /> Project
          </Link>
          <Link
            to="/invoices"
            className="btn-neon flex items-center gap-1.5 px-4 py-2 bg-primary-900/50 border border-primary-500/30 rounded-lg text-sm font-medium text-primary-300 hover:bg-primary-900/80 hover:text-primary-200 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          >
            <Plus className="w-4 h-4" /> Invoice
          </Link>
        </div>
      </div>

      <TodaysFocus 
        kpis={data.kpis}
        overdueInvoices={data.overdue_invoices}
        tasksDueSoon={data.tasks_due_soon}
        clientsWaiting={data.clients_waiting_on_response}
      />

      <KpiGrid kpis={data.kpis} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <NeedsAttention 
              overdueInvoices={data.overdue_invoices}
              upcomingDeadlines={data.upcoming_deadlines}
              tasksDueSoon={data.tasks_due_soon}
              clientsWaiting={data.clients_waiting_on_response}
            />
            
            <FinancialCharts financialSummary={data.financial_summary} />
            
            <ProjectHealthTable projectHealth={data.project_health} />
          </div>
          
          <div className="xl:col-span-1">
            <RecentActivityFeed activities={data.recent_activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
