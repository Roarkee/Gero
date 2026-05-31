import React from "react";
import { useInvoiceIntelligence } from "../hooks/useInvoiceIntelligence";
import { Activity, Clock, CheckCircle } from "lucide-react";

export default function CollectionAnalytics() {
  const { collectionData, isLoading } = useInvoiceIntelligence();

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading collection analytics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Collection Analytics
            <Activity className="w-6 h-6 ml-3 text-indigo-500" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor how effectively and quickly you are getting paid.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Collection Rate</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {collectionData?.collectionRate}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Percentage of total invoiced amount that has been paid.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
            <Clock className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Avg Collection Cycle</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              {collectionData?.avgCollectionDays}
            </span>
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">days</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Average time between invoice issue and payment.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-4">
            <Activity className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Health Score</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-bold ${
              collectionData?.healthScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              collectionData?.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
              'text-rose-600 dark:text-rose-400'
            }`}>
              {collectionData?.healthScore}/100
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Overall metric of your accounts receivable health.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Improving Collections</h3>
         <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
           To improve your health score and shorten your collection cycle, consider automating follow-up emails for overdue invoices and requiring upfront deposits for new projects from High Risk clients.
         </p>
      </div>

    </div>
  );
}
