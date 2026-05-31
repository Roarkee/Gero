import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { useBudget } from "../hooks/useBudget";
import BudgetProgressBar from "../components/BudgetProgressBar";
import RecentExpensesTable from "../components/RecentExpensesTable";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);

const PERIOD_LABELS = {
  daily: "Daily", weekly: "Weekly", fortnightly: "Fortnightly",
  monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly",
};

export default function BudgetDetail() {
  const { id } = useParams();
  const { budget, expenses, isLoading } = useBudget(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4 pt-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
        <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="max-w-3xl mx-auto pt-8 text-center text-gray-500">
        Budget not found.{" "}
        <Link to="/expenses/budgets" className="text-indigo-600 hover:underline">
          Back to budgets
        </Link>
      </div>
    );
  }

  const pct = Number(budget.amount) > 0
    ? (Number(budget.spent_amount) / Number(budget.amount)) * 100
    : 0;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        to="/expenses/budgets"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        All Budgets
      </Link>

      {/* Budget summary card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        {budget.is_over_budget && <div className="h-1.5 bg-rose-500" />}
        <div className="px-8 py-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                <PiggyBank className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {budget.category_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">
                    {PERIOD_LABELS[budget.period] ?? budget.period}
                  </span>
                  <span className="text-xs text-gray-400">
                    {budget.start_date && format(new Date(budget.start_date), "MMM d, yyyy")}
                    {" – "}
                    {budget.end_date && format(new Date(budget.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
            {budget.is_over_budget && (
              <span className="px-3 py-1.5 text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full">
                Over Budget
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(budget.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Spent</p>
              <p className={`text-2xl font-bold ${budget.is_over_budget ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                {formatCurrency(budget.spent_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining</p>
              <p className={`text-2xl font-bold ${budget.is_over_budget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {budget.is_over_budget ? "−" : ""}{formatCurrency(Math.abs(budget.remaining_amount))}
              </p>
            </div>
          </div>

          <BudgetProgressBar spent={budget.spent_amount} budget={budget.amount} />
        </div>
      </div>

      {/* Contributing expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Contributing Expenses
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({expenses.length} transaction{expenses.length !== 1 ? "s" : ""})
            </span>
          </h3>
        </div>
        <div className="px-6 py-4">
          <RecentExpensesTable expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
