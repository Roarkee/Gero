import React from "react";
import { useInvoiceIntelligence } from "../hooks/useInvoiceIntelligence";
import RevenueOverviewCards from "../components/RevenueOverviewCards";
import RevenueTrendChart from "../components/RevenueTrendChart";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function InvoicesDashboard() {
  const { revenueData, hasConcentrationRisk, topClient, isLoading } = useInvoiceIntelligence();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your financial performance and outstanding receivables.
          </p>
        </div>
        <Link 
          to="/invoices/list" 
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          View all invoices
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {hasConcentrationRisk && (
        <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">Revenue Dependency Risk</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Your top client ({topClient?.name}) accounts for {topClient?.revenueShare}% of your total invoiced revenue. 
              High concentration risk can affect cash flow stability.
            </p>
          </div>
        </div>
      )}

      <RevenueOverviewCards data={revenueData} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RevenueTrendChart trendData={revenueData?.trendData} isLoading={isLoading} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center items-center text-center">
           {/* Placeholder for Cash Flow or Collection summary on the dashboard side */}
           <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cash Flow Health</h3>
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
             Monitor your upcoming and overdue receivables to maintain healthy cash flow.
           </p>
           <Link 
             to="/invoices/cash-flow" 
             className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
           >
             Analyze Cash Flow
           </Link>
        </div>
      </div>
    </div>
  );
}
