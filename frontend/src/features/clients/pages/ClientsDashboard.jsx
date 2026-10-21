import React, { useState } from "react";
import { useDashboardIntelligence } from "../hooks/useClients";
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  DollarSign, 
  UserMinus, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Plus,
  Trello
} from "lucide-react";
import { Link } from "react-router-dom";
import { ClientModal } from "../components/ClientModal";

const formatCurrency = (val) => {
  const num = parseFloat(val || 0);
  return `GH₵ ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const STAGE_COLORS = {
  lead: "bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  inquiry: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  proposal_sent: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  negotiating: "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  onboarding: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  waiting_on_client: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  revision: "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  completed: "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  paused: "bg-zinc-50 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800",
  dormant: "bg-stone-50 text-stone-700 dark:bg-stone-900/40 dark:text-stone-300 border-stone-200 dark:border-stone-800",
  churned: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export default function ClientsDashboard() {
  const { data, isLoading, error } = useDashboardIntelligence();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-72 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-6 rounded-2xl text-rose-700 dark:text-rose-300">
          <h3 className="font-bold text-lg mb-1">Failed to load client intelligence</h3>
          <p className="text-sm">Please refresh the page or try again in a few moments.</p>
        </div>
      </div>
    );
  }

  const { stats, pipeline, attention_items, revenue } = data || {};

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.total_clients || 0,
      subLabel: "Across all relationship stages",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Active Clients",
      value: stats?.active_clients || 0,
      subLabel: "Currently ongoing accounts",
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Dormant Clients",
      value: stats?.dormant_clients || 0,
      subLabel: "Inactive or paused accounts",
      icon: UserMinus,
      color: "text-zinc-600 dark:text-zinc-400",
      bg: "bg-zinc-50 dark:bg-zinc-800/60",
    },
    {
      title: "Needs Attention",
      value: attention_items?.length || 0,
      subLabel: "Pending follow-ups or overdue contact",
      icon: AlertTriangle,
      color: (attention_items?.length || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bg: (attention_items?.length || 0) > 0 ? "bg-rose-50 dark:bg-rose-950/40" : "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(revenue?.total_revenue),
      subLabel: "Recognized client lifetime value",
      icon: DollarSign,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Relationship intelligence, pipeline distribution, and account health at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/clients/list"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            All Clients
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 truncate" title={String(card.value)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Attention Required */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                Attention Required
              </h2>
              <Link
                to="/clients/attention"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
              >
                Open Attention Center
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {attention_items?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attention_items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/clients/${item.id}`}
                    className="block group bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 hover:border-rose-300 dark:hover:border-rose-800 transition-all relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                        {item.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <ul className="text-xs text-rose-700 dark:text-rose-400 space-y-1">
                      {item.reasons.map((r, i) => (
                        <li key={i} className="flex items-center">
                          <span className="mr-1.5 font-bold">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">All clear!</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                  None of your clients currently require urgent follow-up or overdue outreach.
                </p>
              </div>
            )}
          </div>

          {/* Pipeline Summary */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Trello className="w-5 h-5 mr-2 text-indigo-500" />
                Pipeline Distribution
              </h2>
              <Link
                to="/clients/board"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
              >
                View Pipeline Board
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {pipeline && pipeline.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pipeline.map((p) => {
                  const styleClass = STAGE_COLORS[p.status] || "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700";
                  return (
                    <Link
                      key={p.status}
                      to="/clients/board"
                      className={`p-3.5 rounded-2xl border ${styleClass} hover:shadow-sm transition-all flex flex-col justify-between`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 opacity-80">
                        {p.status.replace(/_/g, " ")}
                      </div>
                      <div className="text-2xl font-black">{p.total}</div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                No pipeline data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Top Clients */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-500" />
                Top Clients by Revenue
              </h2>
              <Link
                to="/clients/list"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-3 flex-1">
              {revenue?.top_clients && revenue.top_clients.length > 0 ? (
                revenue.top_clients.map((c, i) => {
                  const rankBadgeClass =
                    i === 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300"
                      : i === 1
                      ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300"
                      : i === 2
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400 border-gray-200";

                  return (
                    <Link
                      key={c.id || i}
                      to={`/clients/${c.id}`}
                      className="group flex justify-between items-center p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-200 dark:hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-center min-w-0 pr-3">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 ${rankBadgeClass}`}
                        >
                          {i + 1}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {c.name}
                          </h4>
                          {c.company_name && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {c.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(c.lifetime_value)}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  No client revenue recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
