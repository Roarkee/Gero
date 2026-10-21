import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "./KpiGrid";

const COLORS = {
  paid: "#10B981",       // emerald-500
  sent: "#3B82F6",       // blue-500
  partly_paid: "#F59E0B",// amber-500
  overdue: "#EF4444",    // red-500
  draft: "#94A3B8",      // slate-400
};

const STATUS_LABELS = {
  paid: "Paid",
  sent: "Sent",
  partly_paid: "Partly Paid",
  overdue: "Overdue",
  draft: "Draft",
};

export default function FinancialCharts({ financialSummary }) {
  if (!financialSummary) return null;

  const { revenue_vs_expenses = [], outstanding_invoice_breakdown = {} } = financialSummary;

  // Format revenue vs expenses numbers
  const chartData = revenue_vs_expenses.map((item) => ({
    ...item,
    revenue: parseFloat(item.revenue || 0),
    expenses: parseFloat(item.expenses || 0),
  }));

  // Transform pie chart data
  const pieData = Object.keys(outstanding_invoice_breakdown)
    .map((key) => ({
      name: STATUS_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
      value: parseFloat(outstanding_invoice_breakdown[key] || 0),
      key,
    }))
    .filter((item) => item.value > 0);

  const totalInvoiceVal = Object.values(outstanding_invoice_breakdown).reduce(
    (acc, curr) => acc + parseFloat(curr || 0),
    0
  );

  const formatYAxis = (tick) => {
    if (tick >= 1000) return `GH₵${(tick / 1000).toFixed(0)}k`;
    return `GH₵${tick}`;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3.5 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
          <p className="font-semibold text-xs text-gray-500 dark:text-gray-400 mb-2">{`${data.month_name} ${data.year}`}</p>
          <div className="space-y-1.5">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-4 text-xs font-semibold">
              <span className="text-gray-500 dark:text-gray-400">Net Margin</span>
              <span className={data.revenue >= data.expenses ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                {formatCurrency(data.revenue - data.expenses)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Bar Chart: 6-Month Revenue vs. Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-6 lg:col-span-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Revenue vs. Expenses (6 Months)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparative monthly breakdown of cash in vs cash out
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-gray-700/40" />
                <XAxis 
                  dataKey="month_name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  tickFormatter={formatYAxis} 
                />
                <Tooltip cursor={{ fill: "rgba(241, 245, 249, 0.5)" }} content={<CustomBarTooltip />} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} 
                />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={36} 
                />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#F43F5E" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={36} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
            No financial history recorded for the last 6 months.
          </div>
        )}
      </div>

      {/* 2. Donut Chart: Invoice Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
            Invoice Status Breakdown
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Total invoicing volume: {formatCurrency(totalInvoiceVal)}
          </p>

          {pieData.length > 0 ? (
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.key] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val), "Amount"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm text-center">
              No invoices created yet.
            </div>
          )}
        </div>

        {/* Custom Status Legend with Real Amounts */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const val = parseFloat(outstanding_invoice_breakdown[key] || 0);
            return (
              <div key={key} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[key] }}
                  ></span>
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
