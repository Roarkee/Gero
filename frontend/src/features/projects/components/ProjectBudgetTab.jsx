import React from "react";
import { useProjectIntelligence } from "../hooks/useProjectIntelligence";
import { DollarSign, PieChart as PieChartIcon, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export default function ProjectBudgetTab({ project }) {
  const { budgetQuery, profitabilityQuery } = useProjectIntelligence(project.id);
  
  const budget = budgetQuery.data || {};
  const profitability = profitabilityQuery.data || {};

  const budgetUsed = ((project.budget || 0) * (budget.budget_used_percentage || 0) / 100);
  const remainingBudget = Math.max((project.budget || 0) - budgetUsed, 0);

  const pieData = [
    { name: 'Used', value: budgetUsed },
    { name: 'Remaining', value: remainingBudget }
  ];

  const COLORS = ['#3b82f6', '#e5e7eb'];
  if (budget.projected_over_budget) {
    COLORS[0] = '#ef4444';
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budget</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${project.budget || 0}</h3>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <DollarSign className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Usage</p>
            <h3 className={`text-2xl font-bold mt-1 ${budget.projected_over_budget ? 'text-red-600' : 'text-primary-600'}`}>
              {budget.budget_used_percentage || 0}%
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${budget.projected_over_budget ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-primary-50 text-primary-600 dark:bg-primary-900/30'}`}>
            <PieChartIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${profitability.expenses || 0}</h3>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
            <TrendingDown className="w-6 h-6 text-orange-500" />
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
                <RechartsTooltip formatter={(value) => `$${value}`} />
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
                <span className="text-sm font-bold text-gray-900 dark:text-white">${budgetUsed.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className={`h-2 rounded-full ${budget.projected_over_budget ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(budget.budget_used_percentage || 0, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining Budget</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">${remainingBudget.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${Math.max(100 - (budget.budget_used_percentage || 0), 0)}%` }}></div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              {budget.projected_over_budget && (
                <div className="p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    Warning: Project is over budget or projected to be over budget based on current velocity and spending.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
