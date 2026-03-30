import { useState } from "react";
import { useExpenses, useBudgets } from "../../api/queries/useExpenses";
import {
  Receipt,
  Plus,
  PieChart as PieChartIcon,
  TrendingUp,
  CreditCard,
  Target
} from "lucide-react";
import { Button } from "../../components/ui";
import { format } from "date-fns";
import CreateBudgetModal from "./CreateBudgetModal";
import LogExpenseModal from "./LogExpenseModal";
import CreateCategoryModal from "./CreateCategoryModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];

export default function Expenses() {
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

  if (loadingExpenses || loadingBudgets) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Expenses & Budgets
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track spending, manage budgets, and oversee costs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hidden sm:flex" onClick={() => setCategoryModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
          <Button variant="outline" size="md" className="rounded-xl bg-white" onClick={() => setBudgetModalOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            New Budget
          </Button>
          <Button variant="primary" size="md" className="shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl" onClick={() => setExpenseModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* Budgets Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">Active Budgets</span>
        </h2>

        {(!budgets || budgets.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 mb-2">No active budgets found.</p>
            <Button variant="ghost" size="sm" className="text-indigo-600 font-medium">Create a budget</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = parseFloat(budget.spent_amount || 0);
              const total = parseFloat(budget.amount || 0);
              const percentage = Math.min(100, (spent / total) * 100);
              const over = budget.is_over_budget;

              return (
                <div key={budget.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{budget.category_name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{budget.period}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 mb-2 flex justify-between items-end">
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      ${spent.toFixed(0)} <span className="text-lg text-gray-400 font-medium">/ ${total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className={over ? 'text-red-500' : 'text-gray-500'}>
                      {over ? 'Over budget!' : `${percentage.toFixed(0)}% used`}
                    </span>
                    <span className="text-gray-500">{format(new Date(budget.end_date), "MMM d")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Charts Overview */}
      {expenses && expenses.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
            Expense Category Breakdown
          </h2>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses.reduce((acc, curr) => {
                    const catName = curr.category_name || "Uncategorized";
                    const existing = acc.find(a => a.name === catName);
                    if (existing) existing.value += parseFloat(curr.amount);
                    else acc.push({ name: catName, value: parseFloat(curr.amount) });
                    return acc;
                  }, [])}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Expenses List */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Expenses</h2>

        {(!expenses || expenses.length === 0) ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="mx-auto h-16 w-16 bg-gray-50 dark:bg-gray-900/20 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No expenses logged</h3>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="py-4 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Expense</th>
                  <th className="py-4 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 font-semibold text-xs text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{expense.title}</p>
                          <p className="text-xs text-gray-500">{expense.project_name || 'No Project'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                        {expense.category_name}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-300">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 dark:text-white">
                      ${parseFloat(expense.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCategoryModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      <CreateBudgetModal isOpen={isBudgetModalOpen} onClose={() => setBudgetModalOpen(false)} />
      <LogExpenseModal isOpen={isExpenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
    </div>
  );
}
