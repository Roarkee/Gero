import React from "react";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Sparkles } from "lucide-react";
import { formatCurrency } from "./KpiGrid";

export default function TodaysFocus({
  overdueInvoices = [],
  tasksDueSoon = [],
  kpis = {},
  clientsWaiting = [],
}) {
  const todayDate = format(new Date(), "EEEE, MMMM do, yyyy");
  const profitVal = parseFloat(kpis.profit_this_month || 0);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-md mb-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Today's Focus</h2>
          </div>
          <p className="text-xs text-indigo-200">{todayDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* 1. Tasks Due Soon */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-xs text-indigo-100">Tasks Due Soon</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {tasksDueSoon.length}
          </div>
          <p className="text-[11px] text-indigo-200">
            {tasksDueSoon.length === 1 ? "1 action item pending" : `${tasksDueSoon.length} action items pending`}
          </p>
        </div>

        {/* 2. Overdue Invoices */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-xs text-indigo-100">Overdue Invoices</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {overdueInvoices.length}
          </div>
          <p className="text-[11px] text-indigo-200">
            {formatCurrency(kpis.overdue_invoice_amount)} past due
          </p>
        </div>

        {/* 3. Monthly Profit */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-xs text-indigo-100">Monthly Profit</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(profitVal)}
          </div>
          <p className="text-[11px] text-indigo-200">
            Net earnings this month
          </p>
        </div>

        {/* 4. Client Follow-ups */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-xs text-indigo-100">Client Follow-ups</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {clientsWaiting.length}
          </div>
          <p className="text-[11px] text-indigo-200">
            Clients waiting on response
          </p>
        </div>
      </div>
    </div>
  );
}
