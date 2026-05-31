import React from "react";
import clsx from "clsx";

export function HealthIndicator({ score, label, className }) {
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200";
  let dotClass = "bg-gray-500";

  if (score >= 80) {
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotClass = "bg-emerald-500";
  } else if (score >= 50) {
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    dotClass = "bg-amber-500";
  } else if (score >= 30) {
    colorClass = "bg-orange-50 text-orange-700 border-orange-200";
    dotClass = "bg-orange-500";
  } else {
    colorClass = "bg-red-50 text-red-700 border-red-200";
    dotClass = "bg-red-500";
  }

  const displayLabel = label || (score >= 80 ? 'Healthy' : score >= 50 ? 'Stable' : score >= 30 ? 'At Risk' : 'Critical');

  return (
    <div className={clsx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", colorClass, className)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", dotClass)} />
      {score}% - {displayLabel}
    </div>
  );
}
