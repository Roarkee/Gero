import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, ExternalLink, RefreshCw, Tag, Briefcase, Calendar, DollarSign } from "lucide-react";
import { useExpense } from "../hooks/useExpense";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import toast from "react-hot-toast";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);

function DetailRow({ icon: Icon, label, value, href }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            {value}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-900 dark:text-white">{value ?? "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function ExpenseDetail() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { expense, isLoading, deleteExpense } = useExpense(expenseId);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4 pt-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="max-w-2xl mx-auto pt-8 text-center text-gray-500">
        Expense not found.{" "}
        <Link to="/expenses/list" className="text-indigo-600 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteExpense.mutate(undefined, {
      onSuccess: () => {
        toast.success("Expense deleted");
        navigate("/expenses/list");
      },
      onError: () => toast.error("Failed to delete expense"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/expenses/list"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          All Expenses
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={`/expenses/${expenseId}/edit`}
            className="flex items-center px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center px-3 py-1.5 text-sm font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Amount hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{expense.title}</h2>
              {expense.description && (
                <p className="text-indigo-200 text-sm">{expense.description}</p>
              )}
            </div>
            {expense.is_recurring && (
              <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Recurring</span>
              </div>
            )}
          </div>
          <p className="text-4xl font-bold mt-6">{formatCurrency(expense.amount)}</p>
        </div>

        {/* Detail rows */}
        <div className="px-8 py-2">
          <DetailRow icon={Tag} label="Category" value={expense.category_name ?? `Category #${expense.category}`} />
          <DetailRow icon={Briefcase} label="Project" value={expense.project_name ?? (expense.project ? `Project #${expense.project}` : "No project")} />
          <DetailRow icon={Calendar} label="Date" value={expense.date ? format(new Date(expense.date), "MMMM d, yyyy") : "—"} />
          <DetailRow icon={DollarSign} label="Amount" value={formatCurrency(expense.amount)} />
          {expense.receipt_url && (
            <DetailRow icon={ExternalLink} label="Receipt" value="View Receipt" href={expense.receipt_url} />
          )}
          <DetailRow
            icon={Calendar}
            label="Recorded"
            value={expense.created_at ? format(new Date(expense.created_at), "MMM d, yyyy 'at' h:mm a") : "—"}
          />
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description={`Delete "${expense.title}"? This cannot be undone.`}
        isDeleting={deleteExpense.isPending}
      />
    </div>
  );
}
