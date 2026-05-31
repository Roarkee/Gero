import React from "react";
import { useProjectIntelligence } from "../hooks/useProjectIntelligence";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { TrendingUp, AlertTriangle, Activity, DollarSign, Clock, Target } from "lucide-react";

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function ProjectIntelligenceTab({ project }) {
  const { 
    overviewQuery, healthQuery, budgetQuery, 
    deliveryQuery, productivityQuery, profitabilityQuery 
  } = useProjectIntelligence(project.id);

  const health = healthQuery.data || {};
  const budget = budgetQuery.data || {};
  const delivery = deliveryQuery.data || {};
  const productivity = productivityQuery.data || {};
  const profitability = profitabilityQuery.data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Health & Risk Banner */}
      <div className={`p-6 rounded-xl border flex items-start space-x-4 ${
        health.risk_level === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
        health.risk_level === 'medium' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
        'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      }`}>
        <Activity className={`w-8 h-8 ${
          health.risk_level === 'high' ? 'text-red-600' :
          health.risk_level === 'medium' ? 'text-yellow-600' :
          'text-green-600'
        }`} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            Project Health: {health.health_score || 'Good'}
            {health.at_risk && <span className="ml-3 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full border border-red-200 font-medium flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> At Risk</span>}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Risk Level: <span className="capitalize font-semibold">{health.risk_level || 'Low'}</span>. {health.stalled ? "Project is currently stalled." : "Project is moving steadily."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profitability Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-6">
            <DollarSign className="w-6 h-6 text-primary-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profitability</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${profitability.revenue || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">{profitability.profit_margin || 0}%</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Revenue', amount: parseFloat(profitability.revenue || 0) },
                { name: 'Expenses', amount: parseFloat(profitability.expenses || 0) },
                { name: 'Profit', amount: parseFloat(profitability.profit || 0) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-primary-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Productivity</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Team Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{productivity.team_efficiency_score || 100}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Completion Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{productivity.avg_task_completion_time || 0}h</p>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: productivity.completed_tasks || 0 },
                    { name: 'Remaining', value: (productivity.total_tasks || 0) - (productivity.completed_tasks || 0) }
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-primary-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delivery Metrics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">Completion Velocity</span>
              <span className="font-bold text-gray-900 dark:text-white">{delivery.completion_velocity || 0} tasks/wk</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">Overdue Tasks</span>
              <span className="font-bold text-red-600">{delivery.overdue_tasks || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">Projected Completion</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {delivery.estimated_completion_date ? new Date(delivery.estimated_completion_date).toLocaleDateString() : 'TBD'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">Days Remaining</span>
              <span className="font-bold text-gray-900 dark:text-white">{delivery.projected_completion_days || 0}</span>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center mb-6">
            <Clock className="w-6 h-6 text-primary-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Tracking</h3>
          </div>
          <div className="mb-6">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-gray-600 dark:text-gray-400">Budget Usage</span>
              <span className={budget.projected_over_budget ? 'text-red-600' : 'text-primary-600'}>
                {budget.budget_used_percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className={`h-2.5 rounded-full ${budget.projected_over_budget ? 'bg-red-600' : 'bg-primary-600'}`} 
                style={{ width: `${Math.min(budget.budget_used_percentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${project.budget || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Used Budget</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${((project.budget || 0) * (budget.budget_used_percentage || 0) / 100).toFixed(2)}
              </p>
            </div>
            <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Utilization Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{budget.utilization_rate || 0}%</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
