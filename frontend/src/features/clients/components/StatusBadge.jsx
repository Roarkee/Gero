import React from "react";
import clsx from "clsx";

const STATUS_CONFIG = {
  lead: { label: "Lead", color: "bg-blue-100 text-blue-800 border-blue-200" },
  inquiry: { label: "Inquiry", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  proposal_sent: { label: "Proposal Sent", color: "bg-purple-100 text-purple-800 border-purple-200" },
  negotiating: { label: "Negotiating", color: "bg-pink-100 text-pink-800 border-pink-200" },
  onboarding: { label: "Onboarding", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  waiting_on_client: { label: "Waiting", color: "bg-amber-100 text-amber-800 border-amber-200" },
  revision: { label: "Revision", color: "bg-orange-100 text-orange-800 border-orange-200" },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-800 border-teal-200" },
  paused: { label: "Paused", color: "bg-gray-100 text-gray-800 border-gray-200" },
  dormant: { label: "Dormant", color: "bg-slate-100 text-slate-700 border-slate-200" },
  churned: { label: "Churned", color: "bg-red-100 text-red-800 border-red-200" },
};

export function StatusBadge({ status, className }) {
  const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
