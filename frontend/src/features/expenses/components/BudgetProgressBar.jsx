import React from "react";

/**
 * Usage pct: 0–75 = healthy (emerald), 75–100 = warning (amber), >100 = over (rose)
 */
export default function BudgetProgressBar({ spent, budget, showLabels = true }) {
  const spentNum = Number(spent ?? 0);
  const budgetNum = Number(budget ?? 1);
  const pct = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0;
  const displayPct = Math.min(pct, 100); // cap bar at 100%

  const status =
    pct >= 100
      ? { label: "Over budget", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", track: "bg-rose-100 dark:bg-rose-900/20" }
      : pct >= 75
      ? { label: "Warning", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", track: "bg-amber-100 dark:bg-amber-900/20" }
      : { label: "Healthy", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", track: "bg-emerald-50 dark:bg-emerald-900/10" };

  return (
    <div>
      {showLabels && (
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className={`font-semibold ${status.text}`}>{status.label}</span>
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            {pct.toFixed(1)}%
          </span>
        </div>
      )}
      <div className={`w-full h-2.5 rounded-full ${status.track}`}>
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${status.bar}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}
