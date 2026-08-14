import React, { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import { useProjectIntelligence } from "../hooks/useProjectIntelligence";
import { DollarSign, PieChart as PieChartIcon, TrendingDown, Edit2, Trash2, Plus, X, Save } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import toast from "react-hot-toast";
import { useExpenses, useCreateExpense, useDeleteExpense, useExpenseCategories } from "../../../api/queries/useExpenses";

const fmt = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);

export default function ProjectBudgetTab({ project }) {
  const { budgetQuery, profitabilityQuery } = useProjectIntelligence(project.id);
  const { updateProject } = useProjects();
  
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(project.id);
  const { data: categories = [] } = useExpenseCategories();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const budget = budgetQuery.data || {};
  const profitability = profitabilityQuery.data || {};

  // Issue 4 fix: local state for budget form
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(project.budget ?? "");
  const [isSaving, setIsSaving] = useState(false);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", date: new Date().toISOString().split('T')[0], category: "" });

  const handleAddExpense = async () => {
    try {
      await createExpense.mutateAsync({
        ...newExpense,
        project: project.id,
      });
      toast.success("Expense added");
      setShowExpenseModal(false);
      setNewExpense({ title: "", amount: "", date: new Date().toISOString().split('T')[0], category: "" });
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const hasBudget = project.budget !== null && project.budget !== undefined;
  const budgetAmount = Number(budget.budget ?? project.budget ?? 0);
  const totalCost = Number(budget.total_cost ?? 0);
  const budgetUsedPct = Number(budget.budget_usage_percentage ?? 0);
  const remainingBudget = Number(budget.remaining_budget ?? 0);
  const isOverBudget = Boolean(budget.is_over_budget ?? false);

  const pieData = [
    { name: "Used", value: totalCost },
    { name: "Remaining", value: Math.max(remainingBudget, 0) },
  ];
  const COLORS = isOverBudget ? ["#ef4444", "#e5e7eb"] : ["#3b82f6", "#e5e7eb"];

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid budget amount.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProject.mutateAsync({ id: project.id, budget: val });
      toast.success("Budget saved");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBudget = async () => {
    if (!confirm("Remove budget from this project?")) return;
    setIsSaving(true);
    try {
      await updateProject.mutateAsync({ id: project.id, budget: null });
      toast.success("Budget removed");
      setBudgetInput("");
    } catch {
      toast.error("Failed to remove budget");
    } finally {
      setIsSaving(false);
    }
  };

  // Empty state — no budget set
  if (!hasBudget && !isEditing) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No budget set
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
              Set a budget to track spending, monitor utilization, and get over-budget alerts.
            </p>
            <button
              onClick={() => { setBudgetInput(""); setIsEditing(true); }}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set Project Budget
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* Budget Header: show edit form or summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Budget</h3>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => { setBudgetInput(project.budget ?? ""); setIsEditing(true); }}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </button>
                <button
                  onClick={handleRemoveBudget}
                  disabled={isSaving}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </button>
                <button
                  onClick={handleSaveBudget}
                  disabled={isSaving}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Budget Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                autoFocus
                className="pl-7 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors w-48"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{fmt(budgetAmount)}</span>
            <span className="text-sm text-gray-400">total budget</span>
          </div>
        )}
      </div>

      {/* Top Cards */}
      {!isEditing && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Usage</p>
                <h3 className={`text-2xl font-bold mt-1 ${isOverBudget ? "text-red-600" : "text-primary-600"}`}>
                  {budgetUsedPct.toFixed(1)}%
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${isOverBudget ? "bg-red-50 text-red-600 dark:bg-red-900/30" : "bg-primary-50 text-primary-600 dark:bg-primary-900/30"}`}>
                <PieChartIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Costs</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{fmt(totalCost)}</h3>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</p>
                <h3 className={`text-2xl font-bold mt-1 ${isOverBudget ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {fmt(isOverBudget ? Math.abs(remainingBudget) : remainingBudget)}
                  {isOverBudget && <span className="text-sm font-normal text-red-500 ml-1">over</span>}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${isOverBudget ? "bg-red-50 dark:bg-red-900/30" : "bg-emerald-50 dark:bg-emerald-900/30"}`}>
                <DollarSign className={`w-6 h-6 ${isOverBudget ? "text-red-500" : "text-emerald-500"}`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-center items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 self-start">Budget Allocation</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => fmt(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cost Breakdown</h3>
              </div>
              <div className="flex-1 p-6 flex flex-col justify-center space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Used Budget</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(totalCost)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${isOverBudget ? "bg-red-500" : "bg-primary-500"}`}
                      style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining Budget</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(remainingBudget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className="bg-gray-400 h-2 rounded-full"
                      style={{ width: `${Math.max(100 - budgetUsedPct, 0)}%` }}
                    />
                  </div>
                </div>

                {isOverBudget && (
                  <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                        ⚠ Warning: Project is over budget or projected to exceed budget based on current spending velocity.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Expenses</h3>
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Expense
              </button>
            </div>
            
            {expensesLoading ? (
              <div className="p-8 text-center text-gray-500">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700">
                  <TrendingDown className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-gray-900 dark:text-white font-medium mb-1">No expenses yet</h4>
                <p className="text-sm text-gray-500">Track your project costs by adding an expense.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {expenses.map((expense) => {
                  const category = categories.find(c => c.id === expense.category);
                  return (
                    <div key={expense.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" 
                          style={{ backgroundColor: `${category?.color || '#3B82F6'}20`, color: category?.color || '#3B82F6' }}
                        >
                          <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{expense.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{expense.date}</span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {category?.name || 'Uncategorized'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          -{fmt(expense.amount)}
                        </span>
                        <button
                          onClick={() => deleteExpense.mutate(expense.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Expense Modal (Inline for simplicity) */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newExpense.title}
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Server Hosting"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-orange-500 mt-1">You need to create categories in Expenses first.</p>
                )}
              </div>
              <button 
                onClick={handleAddExpense}
                disabled={!newExpense.title || !newExpense.amount || !newExpense.category || !newExpense.date || createExpense.isPending}
                className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 mt-4"
              >
                {createExpense.isPending ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
