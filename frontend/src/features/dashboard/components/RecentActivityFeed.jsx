import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  FileText,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  Activity,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

const getActivityConfig = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("paid") || t.includes("completed")) {
    return {
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    };
  }
  if (t.includes("invoice")) {
    return {
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    };
  }
  if (t.includes("payment")) {
    return {
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    };
  }
  if (t.includes("client")) {
    return {
      icon: Users,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    };
  }
  if (t.includes("timer") || t.includes("time")) {
    return {
      icon: Clock,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
    };
  }
  if (t.includes("create")) {
    return {
      icon: PlusCircle,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    };
  }
  if (t.includes("update") || t.includes("moved")) {
    return {
      icon: RefreshCw,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    };
  }
  return {
    icon: Activity,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
  };
};

export default function RecentActivityFeed({ activities = [] }) {
  const formatTime = (ts) => {
    try {
      return formatDistanceToNow(new Date(ts), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Recent Activity
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit trail of project milestones, client interactions, and invoicing events
          </p>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="relative">
          <div className="absolute top-3 bottom-3 left-4 w-px bg-gray-100 dark:bg-gray-700"></div>
          <ul className="space-y-5 relative z-10">
            {activities.map((act) => {
              const { icon: Icon, color, bg } = getActivityConfig(act.type);
              const targetRoute = act.model === "project" ? `/projects/${act.related_id}` : `/clients/${act.related_id}`;

              return (
                <li key={act.id} className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${bg} ${color} shrink-0 ring-4 ring-white dark:ring-gray-800`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {act.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {formatTime(act.timestamp)}
                      </span>
                      {act.related_id && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <Link
                            to={targetRoute}
                            className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline capitalize"
                          >
                            View {act.model}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          No recent activity logged yet.
        </div>
      )}
    </div>
  );
}
