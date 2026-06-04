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
            <span className={`px-4 py-2 rounded-xl text-lg font-bold ${
              collectionData?.healthScore === 'Excellent' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
              collectionData?.healthScore === 'Needs Attention' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
              collectionData?.healthScore === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
              'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
            }`}>
              {collectionData?.healthScore || 'Good'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Overall metric of your accounts receivable health.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Needs Attention</h3>
         {collectionData?.needsAttentionInvoices && collectionData.needsAttentionInvoices.length > 0 ? (
           <div className="space-y-4">
             {collectionData.needsAttentionInvoices.map(invoice => (
               <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <div>
                   <p className="font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Client: {invoice.client_name || `Client #${invoice.client}`}</p>
                 </div>
                 <div className="text-right">
                   <p className="font-bold text-rose-600 dark:text-rose-400">
                     ${parseFloat(invoice.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                   </p>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
             No invoices currently need attention. Keep up the good work!
           </p>
         )}
      </div>

    </div>
  );
}
