import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: 'GHS' }).format(v ?? 0);

export default function RecentExpensesTable({ expenses = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="text-center py-10 text-gray-400 dark:text-gray-500">
        No expenses recorded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Title
            </th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Category
            </th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {expenses.map((exp) => (
            <tr key={exp.id} className="group">
              <td className="py-3 pr-4">
                <Link
                  to={`/expenses/${exp.id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2"
                >
                  {exp.title}
                  {exp.is_recurring && (
                    <RefreshCw className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  )}
                </Link>
                {exp.project_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{exp.project_name}</p>
                )}
              </td>
              <td className="py-3 pr-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {exp.category_name ?? "Uncategorized"}
                </span>
              </td>
              <td className="py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(exp.amount)}
              </td>
              <td className="py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                {exp.date ? format(new Date(exp.date), "MMM d, yyyy") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
