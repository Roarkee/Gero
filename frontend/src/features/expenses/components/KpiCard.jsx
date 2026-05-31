import React from "react";

export default function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = "text-indigo-500",
  iconBg = "bg-indigo-50 dark:bg-indigo-900/20",
  isLoading = false,
  valueColor = "text-gray-900 dark:text-white",
}) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className={`text-3xl font-bold ${valueColor}`}>{value ?? "—"}</p>
          {subtext && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {subtext}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}
