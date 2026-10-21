import React from "react";
import { useInvoiceIntelligence } from "../hooks/useInvoiceIntelligence";
import RevenueTrendChart from "../components/RevenueTrendChart";
import { TrendingUp, AlertTriangle } from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount || 0);
};

export default function RevenueAnalytics() {
  const { revenueData, hasConcentrationRisk, topClient, isLoading } = useInvoiceIntelligence();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Revenue Analytics
            <TrendingUp className="w-6 h-6 ml-3 text-indigo-500" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Deep dive into your revenue trends and client concentration.
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RevenueTrendChart trendData={revenueData?.trendData} isLoading={isLoading} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Breakdown</h3>
            
            <div className="space-y-5 flex-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Recognized Revenue</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(revenueData?.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  From {revenueData?.paidCount || 0} paid invoices
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Pipeline</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(revenueData?.pipelineRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Draft, Sent & Overdue ({revenueData?.pipelineCount || 0} invoices)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Outstanding Receivables</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(revenueData?.outstandingRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Awaiting payment (excl. drafts) ({revenueData?.sentCount || 0} invoices)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Overdue Amount</p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(revenueData?.overdueRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Past due date ({revenueData?.overdueCount || 0} invoices)
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                 <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Average Invoice Size</p>
                 <p className="text-lg font-bold text-gray-900 dark:text-white">
                   {formatCurrency(revenueData?.avgInvoiceSize)}
                 </p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                   Average value per settled invoice
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
