import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, PiggyBank, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useBudgets } from "../hooks/useBudgets";
import BudgetProgressBar from "../components/BudgetProgressBar";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import toast from "react-hot-toast";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: 'GHS' }).format(v ?? 0);

const PERIOD_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default function BudgetsDashboard() {
  const { budgets, overBudgetCount, isLoading, deleteBudget } = useBudgets();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBudget.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Budget deleted"); setDeleteTarget(null); },
      onError: () => toast.error("Failed to delete budget"),
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {budgets.length} active budget{budgets.length !== 1 ? "s" : ""}
            {overBudgetCount > 0 && (
              <span className="ml-2 text-rose-600 font-medium">
                · {overBudgetCount} over limit
              </span>
            )}
          </p>
        </div>
        <Link
          to="/expenses/budgets/new"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Budget
        </Link>
      </div>

      {/* Over-budget alert banner */}
      {overBudgetCount > 0 && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
              {overBudgetCount} budget{overBudgetCount > 1 ? "s" : ""} exceeded
            </p>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Review your spending in the affected categories.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
          <PiggyBank className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-6">No budgets set up yet.</p>
          <Link
            to="/expenses/budgets/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Create your first budget
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {budgets.map((budget) => {
            const pct = budget.amount > 0
              ? (Number(budget.spent_amount) / Number(budget.amount)) * 100
              : 0;

            return (
              <div
                key={budget.id}
                className={`bg-white dark:bg-gray-800 rounded-3xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${
                  budget.is_over_budget
                    ? "border-rose-300 dark:border-rose-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {budget.is_over_budget && (
                  <div className="h-1 bg-rose-500" />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {budget.category_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">
                          {PERIOD_LABELS[budget.period] ?? budget.period}
                        </span>
                        <span className="text-xs text-gray-400">
                          {budget.start_date && format(new Date(budget.start_date), "MMM d")}
                          {" – "}
                          {budget.end_date && format(new Date(budget.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(budget)}
                      className="p-1.5 text-gray-300 hover:text-rose-500 dark:text-gray-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-5 text-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Budget</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Spent</p>
                      <p className={`text-sm font-bold ${budget.is_over_budget ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                        {formatCurrency(budget.spent_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                      <p className={`text-sm font-bold ${budget.is_over_budget ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {budget.is_over_budget ? "-" : ""}{formatCurrency(Math.abs(budget.remaining_amount))}
                      </p>
                    </div>
                  </div>

                  <BudgetProgressBar spent={budget.spent_amount} budget={budget.amount} />

                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/expenses/budgets/${budget.id}`}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        description={`Delete the "${deleteTarget?.category_name}" budget? This cannot be undone.`}
        isDeleting={deleteBudget.isPending}
      />
    </div>
  );
}
