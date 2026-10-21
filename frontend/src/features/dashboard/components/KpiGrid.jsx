import React from "react";
import {
  Briefcase,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return `GH₵ ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const KpiCard = ({ title, value, icon: Icon, subLabel, iconColor, iconBg, badge, isNegative }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className={`text-2xl font-bold tracking-tight ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </h3>
          {badge && (
            <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${badge.className}`}>
              {badge.icon && <badge.icon className="w-3 h-3 mr-0.5" />}
              {badge.text}
            </span>
          )}
        </div>
        {subLabel && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
};

export default function KpiGrid({ kpis }) {
  if (!kpis) return null;

  const profitVal = parseFloat(kpis.profit_this_month || 0);
  const revenueVal = parseFloat(kpis.monthly_revenue || 0);
  const expensesVal = parseFloat(kpis.monthly_expenses || 0);
  const isProfitPositive = profitVal >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Profit This Month */}
      <KpiCard
        title="Profit This Month"
        value={formatCurrency(profitVal)}
        icon={DollarSign}
        iconColor={isProfitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
        iconBg={isProfitPositive ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40"}
        subLabel="Net (Revenue − Expenses)"
        isNegative={profitVal < 0}
        badge={{
          icon: isProfitPositive ? ArrowUpRight : ArrowDownRight,
          text: isProfitPositive ? "Net Positive" : "Deficit",
          className: isProfitPositive 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
            : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
        }}
      />

      {/* 2. Monthly Revenue */}
      <KpiCard
        title="Monthly Revenue"
        value={formatCurrency(revenueVal)}
        icon={TrendingUp}
        iconColor="text-blue-600 dark:text-blue-400"
        iconBg="bg-blue-50 dark:bg-blue-950/40"
        subLabel="Collected payments this month"
      />

      {/* 3. Monthly Expenses */}
      <KpiCard
        title="Monthly Expenses"
        value={formatCurrency(expensesVal)}
        icon={Activity}
        iconColor="text-violet-600 dark:text-violet-400"
        iconBg="bg-violet-50 dark:bg-violet-950/40"
        subLabel="Logged business expenses"
      />

      {/* 4. Hours Tracked This Month */}
      <KpiCard
        title="Hours Tracked"
        value={`${parseFloat(kpis.hours_tracked_this_month || 0).toFixed(1)}h`}
        icon={Clock}
        iconColor="text-cyan-600 dark:text-cyan-400"
        iconBg="bg-cyan-50 dark:bg-cyan-950/40"
        subLabel="Time logged this month"
      />

      {/* 5. Active Projects */}
      <KpiCard
        title="Active Projects"
        value={kpis.active_projects ?? 0}
        icon={Briefcase}
        iconColor="text-indigo-600 dark:text-indigo-400"
        iconBg="bg-indigo-50 dark:bg-indigo-950/40"
        subLabel="Currently in progress"
      />

      {/* 6. Active Clients */}
      <KpiCard
        title="Active Clients"
        value={kpis.active_clients ?? 0}
        icon={Users}
        iconColor="text-sky-600 dark:text-sky-400"
        iconBg="bg-sky-50 dark:bg-sky-950/40"
        subLabel="Ongoing relationships"
      />

      {/* 7. Outstanding Invoices */}
      <KpiCard
        title="Outstanding Invoices"
        value={formatCurrency(kpis.outstanding_invoice_amount)}
        icon={AlertTriangle}
        iconColor="text-amber-600 dark:text-amber-400"
        iconBg="bg-amber-50 dark:bg-amber-950/40"
        subLabel="Awaiting client payment"
      />

      {/* 8. Overdue Invoices Amount */}
      <KpiCard
        title="Overdue Amount"
        value={formatCurrency(kpis.overdue_invoice_amount)}
        icon={AlertTriangle}
        iconColor="text-rose-600 dark:text-rose-400"
        iconBg="bg-rose-50 dark:bg-rose-950/40"
        subLabel="Past due payment date"
        isNegative={parseFloat(kpis.overdue_invoice_amount || 0) > 0}
      />
    </div>
  );
}
