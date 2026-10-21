import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Receipt, RefreshCw, AlertCircle } from "lucide-react";

import { useDashboard } from "../hooks/useDashboard";
import { useAuthStore } from "@/store/authStore";

import KpiGrid from "../components/KpiGrid";
import TodaysFocus from "../components/TodaysFocus";
import NeedsAttention from "../components/NeedsAttention";
import FinancialCharts from "../components/FinancialCharts";
import ProjectHealthTable from "../components/ProjectHealthTable";
import RecentActivityFeed from "../components/RecentActivityFeed";
import CreateProjectModal from "@/features/projects/CreateProjectModal";

const DashboardSkeleton = () => (
  <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="flex justify-between items-center mb-8">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-28"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-28"></div>
      </div>
    </div>
    <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-2xl w-full"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      ))}
    </div>
    <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();
  const { user } = useAuthStore();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-[#0B0F19]">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50/50 dark:bg-[#0B0F19]">
        <div className="bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center justify-center mx-auto mb-4 text-rose-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            {error?.message || "There was an issue connecting to the server. Please verify your connection and try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }
  console.log(data)

  const {
    kpis = {},
    overdue_invoices = [],
    upcoming_deadlines = [],
    tasks_due_soon = [],
    clients_waiting_on_response = [],
    recent_activity = [],
    financial_summary = {},
    project_health = [],
  } = data;

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-[#0B0F19] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {getGreeting()}, {user?.first_name || user?.username || "Freelancer"}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here's a comprehensive overview of your active operations and performance.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refetch()}
              title="Refresh data"
              disabled={isRefetching}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              New Project
            </button>

            <Link
              to="/invoices"
              className="inline-flex items-center px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
              New Invoice
            </Link>

            <Link
              to="/expenses/new"
              className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-indigo-100 dark:shadow-none"
            >
              <Receipt className="w-3.5 h-3.5 mr-1.5" />
              Log Expense
            </Link>
          </div>
        </div>

        {/* 1. Today's Executive Focus */}
        <TodaysFocus
          overdueInvoices={overdue_invoices}
          tasksDueSoon={tasks_due_soon}
          kpis={kpis}
          clientsWaiting={clients_waiting_on_response}
        />

        {/* 2. All 8 KPI Cards (including Monthly Revenue, Monthly Expenses, Hours Tracked) */}
        <KpiGrid kpis={kpis} />

        {/* 3. Needs Attention Quadrant (Overdue Invoices, Tasks Due Soon, Project Deadlines, Clients Waiting) */}
        <NeedsAttention
          overdueInvoices={overdue_invoices}
          upcomingDeadlines={upcoming_deadlines}
          tasksDueSoon={tasks_due_soon}
          clientsWaiting={clients_waiting_on_response}
        />

        {/* 4. Financial Charts (6-Month Revenue vs. Expenses + Invoice Status Breakdown) */}
        <FinancialCharts financialSummary={financial_summary} />

        {/* 5. Project Health & Resource Allocation (Progress %, Budget Used %, Logged Hours) */}
        <ProjectHealthTable projectHealth={project_health} />

        {/* 6. Recent Activity Feed */}
        <RecentActivityFeed activities={recent_activity} />

      </div>

      {/* New Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => {
          setIsCreateProjectOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
