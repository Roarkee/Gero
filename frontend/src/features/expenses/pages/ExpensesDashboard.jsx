import React from "react";
import { Link } from "react-router-dom";
import { DollarSign, PiggyBank, AlertTriangle, Tag, Plus, ArrowRight } from "lucide-react";
import { useExpenseDashboard } from "../hooks/useExpenseDashboard";
import { useExpenses } from "../hooks/useExpenses";
import { useBudgets } from "../hooks/useBudgets";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import KpiCard from "../components/KpiCard";
import ExpenseTrendChart from "../components/ExpenseTrendChart";
import CategoryPieChart from "../components/CategoryPieChart";
import RecentExpensesTable from "../components/RecentExpensesTable";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: 'GHS' }).format(v ?? 0);

export default function ExpensesDashboard() {
  const { monthlyExpenses, categoryExpenses, monthlyTrend, totalCategories, isLoading: dashLoading } = useExpenseDashboard();
  const { expenses, isLoading: expLoading } = useExpenses({ page_size: 5 });
  const { activeBudgetCount, overBudgetCount, isLoading: budgetLoading } = useBudgets();
  const { categories } = useExpenseCategories();

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Overview
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and manage your business spending.
          </p>
        </div>
        <Link
          to="/expenses/new"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="Total Expenses This Month"
          value={formatCurrency(monthlyExpenses)}
          icon={DollarSign}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          isLoading={dashLoading}
        />
        <KpiCard
          label="Active Budgets"
          value={activeBudgetCount}
          subtext="across all categories"
          icon={PiggyBank}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          isLoading={budgetLoading}
        />
        <KpiCard
          label="Over Budget"
          value={overBudgetCount}
          subtext={overBudgetCount > 0 ? "categories exceeded limit" : "All budgets within range"}
          icon={AlertTriangle}
          iconColor={overBudgetCount > 0 ? "text-rose-500" : "text-gray-400"}
          iconBg={overBudgetCount > 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-gray-50 dark:bg-gray-800"}
          valueColor={overBudgetCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}
          isLoading={budgetLoading}
        />
        <KpiCard
          label="Total Categories"
          value={totalCategories || categories.length}
          subtext="spending categories defined"
          icon={Tag}
          iconColor="text-violet-500"
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          isLoading={dashLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseTrendChart trendData={monthlyTrend} isLoading={dashLoading} />
        </div>
        <div>
          <CategoryPieChart categoryExpenses={categoryExpenses} isLoading={dashLoading} />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Recent Expenses</h3>
          <Link
            to="/expenses/list"
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="px-6 py-4">
          <RecentExpensesTable expenses={recentExpenses} isLoading={expLoading} />
        </div>
      </div>
    </div>
  );
}
