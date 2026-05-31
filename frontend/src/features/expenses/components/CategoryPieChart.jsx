import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tag } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{entry.name}</p>
      <p className="text-white font-bold text-sm">
        ${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-indigo-400 mt-0.5">
        {entry.payload.percent
          ? `${(entry.payload.percent * 100).toFixed(1)}%`
          : ""}
      </p>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <ul className="space-y-2 mt-4">
    {payload.map((entry) => (
      <li key={entry.value} className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      </li>
    ))}
  </ul>
);

export default function CategoryPieChart({ categoryExpenses = [], isLoading = false }) {
  // Map backend shape: { category__name, category__color, total }
  const chartData = categoryExpenses.map((c) => ({
    name: c.category__name ?? c.name ?? "Unknown",
    value: Number(c.total ?? 0),
    color: c.category__color ?? c.color ?? "#6366f1",
  }));

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-72 animate-pulse flex items-center justify-center">
        <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700/50 rounded-full" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm h-72 flex flex-col items-center justify-center text-gray-400">
        <Tag className="w-10 h-10 mb-3 opacity-40" />
        <p>No category data this month</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Spending by Category
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          This month's breakdown
        </p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
