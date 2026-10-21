import React from "react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { AlertCircle, Calendar, Users, Clock, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "./KpiGrid";

export default function NeedsAttention({
  overdueInvoices = [],
  upcomingDeadlines = [],
  tasksDueSoon = [],
  clientsWaiting = [],
}) {
  const formatTaskDate = (dueDateStr) => {
    if (!dueDateStr) return "Soon";
    try {
      const date = new Date(dueDateStr);
      if (isToday(date)) return "Today";
      if (isTomorrow(date)) return "Tomorrow";
      return format(date, "MMM d");
    } catch {
      return dueDateStr;
    }
  };

  const formatClientDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 mb-8 overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border-b border-rose-100/70 dark:border-rose-900/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500 text-white">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Needs Immediate Attention
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Active bottlenecks, overdue payments, and impending deadlines
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700/60">
        
        {/* 1. Overdue Invoices Card */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Overdue Invoices
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                {overdueInvoices.length}
              </span>
            </div>

            {overdueInvoices.length > 0 ? (
              <ul className="space-y-3">
                {overdueInvoices.slice(0, 4).map((inv) => (
                  <li key={inv.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(inv.amount_due)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400 truncate max-w-[110px]">
                        {inv.client_name}
                      </span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                        {inv.days_overdue}d overdue
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  All clear!
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  No invoices are overdue
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <Link
              to="/invoices"
              className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Manage all invoices
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* 2. Tasks Due Soon Card */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Tasks Due Soon
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                {tasksDueSoon.length}
              </span>
            </div>

            {tasksDueSoon.length > 0 ? (
              <ul className="space-y-3">
                {tasksDueSoon.slice(0, 4).map((task) => {
                  const dateLabel = formatTaskDate(task.due_date);
                  const isUrgent = dateLabel === "Today" || dateLabel === "Tomorrow";

                  return (
                    <li key={task.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <Link
                          to={`/projects/${task.project_id}?tab=tasks`}
                          className="font-medium text-xs text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1"
                        >
                          {task.task_title}
                        </Link>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          isUrgent 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' 
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                        }`}>
                          {dateLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {task.project_name}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  No urgent tasks
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  You are fully on schedule
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <Link
              to="/projects"
              className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              View project tasks
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* 3. Upcoming Project Deadlines Card */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Project Deadlines
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {upcomingDeadlines.length}
              </span>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <ul className="space-y-3">
                {upcomingDeadlines.slice(0, 4).map((proj) => (
                  <li key={proj.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Link
                        to={`/projects/${proj.id}`}
                        className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-1"
                      >
                        {proj.project_name}
                      </Link>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {proj.days_remaining}d left
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {proj.client_name}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  No near deadlines
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Projects have comfortable timelines
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <Link
              to="/projects"
              className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Review all projects
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* 4. Clients Waiting on Response Card */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Clients Awaiting Response
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                {clientsWaiting.length}
              </span>
            </div>

            {clientsWaiting.length > 0 ? (
              <ul className="space-y-3">
                {clientsWaiting.slice(0, 4).map((client) => (
                  <li key={client.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 hover:border-sky-200 dark:hover:border-sky-800 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Link
                        to={`/clients/${client.id}`}
                        className="font-semibold text-xs text-sky-600 dark:text-sky-400 hover:underline truncate"
                      >
                        {client.client_name}
                      </Link>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                        Waiting
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Since {formatClientDate(client.last_activity_date)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  No pending replies
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  All clients are up to date
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <Link
              to="/clients"
              className="inline-flex items-center text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
            >
              Open Client Manager
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
