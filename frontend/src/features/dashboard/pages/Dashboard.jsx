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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/ai-workflow"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 border border-transparent rounded-lg text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> AI Workflow
          </Link>
          <Link
            to="/clients"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Client
          </Link>
          <Link
            to="/projects"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Project
          </Link>
          <Link
            to="/invoices"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
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
  );
}
