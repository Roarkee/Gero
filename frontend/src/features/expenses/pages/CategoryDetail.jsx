import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { useExpenseCategory } from "../hooks/useExpenseCategory";
import RecentExpensesTable from "../components/RecentExpensesTable";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);

export default function CategoryDetail() {
  const { id } = useParams();
  const { category, expenses, isLoading } = useExpenseCategory(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4 pt-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-3xl mx-auto pt-8 text-center text-gray-500">
        Category not found.{" "}
        <Link to="/expenses/categories" className="text-indigo-600 hover:underline">
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        to="/expenses/categories"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        All Categories
      </Link>

      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="h-3" style={{ backgroundColor: category.color ?? "#6366f1" }} />
        <div className="px-8 py-6 flex items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${category.color ?? "#6366f1"}22` }}
          >
            <Tag className="w-8 h-8" style={{ color: category.color ?? "#6366f1" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h2>
            {category.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(category.total_spent)}
            </p>
            <p className="text-sm text-gray-400 mt-1">{expenses.length} expenses</p>
          </div>
        </div>
      </div>

      {/* Expenses in category */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Expenses in this category</h3>
        </div>
        <div className="px-6 py-4">
          <RecentExpensesTable expenses={expenses} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
