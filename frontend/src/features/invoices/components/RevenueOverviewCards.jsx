import React from "react";
import { DollarSign, FileText, AlertCircle, AlertTriangle, Layers, Clock } from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount || 0);
};

export default function RevenueOverviewCards({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Recognized Revenue",
      value: formatCurrency(data?.totalRevenue),
      subLabel: `${data?.paidCount || 0} paid invoices`,
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Total Pipeline",
      value: formatCurrency(data?.pipelineRevenue),
      subLabel: "Draft, Sent & Overdue",
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      title: "Outstanding Receivables",
      value: formatCurrency(data?.outstandingRevenue),
      subLabel: "Awaiting payment (excl. drafts)",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(data?.overdueRevenue),
      subLabel: `${data?.overdueCount || 0} past due date`,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      title: "Avg. Invoice Size",
      value: formatCurrency(data?.avgInvoiceSize),
      subLabel: "Per paid invoice",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight mb-1" title={card.value}>
                {card.value}
              </h3>
              {card.subLabel && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {card.subLabel}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
