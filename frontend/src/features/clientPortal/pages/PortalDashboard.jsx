import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, CreditCard, MessageSquare, AlertCircle } from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export default function PortalDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_DASHBOARD);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Welcome back, {dashboardData.freelancer_name ? `client of ${dashboardData.freelancer_name}` : "Client"}
      </h1>
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <Link to="/portal/projects" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Active Projects</h3>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.active_projects}
          </div>
        </Link>
        
        <Link to="/portal/invoices" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Outstanding Invoices</h3>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.outstanding_invoices}
          </div>
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <span className="font-bold text-lg">GH₵</span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Total Outstanding</h3>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            GH₵{(dashboardData.total_outstanding || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        
        <Link to="/portal/projects" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Total Messages</h3>
          </div>
          <div className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {dashboardData.unread_messages}
          </div>
        </Link>
      </div>
    </div>
  );
}
