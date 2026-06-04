import {
  Briefcase,
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
} from "lucide-react";

const KpiCard = ({ title, value, icon: Icon, subLabel, color }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
      </div>
    </div>
  );
};

export default function KpiGrid({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KpiCard
        title="Active Projects"
        value={kpis.active_projects}
        icon={Briefcase}
        color="bg-blue-500"
        subLabel="Currently in progress"
      />
      <KpiCard
        title="Active Clients"
        value={kpis.active_clients}
        icon={Users}
        color="bg-purple-500"
        subLabel="Active relationships"
      />
      <KpiCard
        title="Outstanding Invoices"
        value={`$${kpis.outstanding_invoice_amount}`}
        icon={AlertTriangle}
        color="bg-orange-500"
        subLabel="Total unpaid amount"
      />
      <KpiCard
        title="Overdue Amount"
        value={`$${kpis.overdue_invoice_amount}`}
        icon={TrendingDown}
        color="bg-red-500"
        subLabel="Past due date"
      />
      <KpiCard
        title="Monthly Revenue"
        value={`$${kpis.monthly_revenue}`}
        icon={TrendingUp}
        color="bg-emerald-500"
        subLabel="Paid this month"
      />
      <KpiCard
        title="Monthly Expenses"
        value={`$${kpis.monthly_expenses}`}
        icon={Activity}
        color="bg-rose-500"
        subLabel="Logged this month"
      />
      <KpiCard
        title="Profit This Month"
        value={`$${kpis.profit_this_month}`}
        icon={DollarSign}
        color="bg-indigo-500"
        subLabel="Revenue - Expenses"
      />
      <KpiCard
        title="Hours Tracked"
        value={`${kpis.hours_tracked_this_month}h`}
        icon={Clock}
        color="bg-cyan-500"
        subLabel="Logged this month"
      />
    </div>
  );
}
