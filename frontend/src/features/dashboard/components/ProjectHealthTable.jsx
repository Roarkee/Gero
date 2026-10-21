import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight, Clock, AlertTriangle } from "lucide-react";

export default function ProjectHealthTable({ projectHealth = [] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Project Health & Resource Allocation
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time delivery progress, budget utilization, and tracked hours
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          View all projects
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {projectHealth.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/75 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Project</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Progress</th>
                <th className="px-6 py-3.5">Budget Used</th>
                <th className="px-6 py-3.5 text-right">Logged Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {projectHealth.map((project) => {
                const budgetUsed = Math.round(parseFloat(project.budget_used_percentage || 0));
                const progress = Math.min(100, Math.max(0, Math.round(project.progress_percentage || 0)));
                const isOverBudget = budgetUsed > 100;
                const isNearBudget = budgetUsed > 85 && budgetUsed <= 100;

                return (
                  <tr key={project.id} className="hover:bg-gray-50/75 dark:hover:bg-gray-750/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {project.project_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                      {project.client_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        project.status === "active"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : project.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isOverBudget
                                ? "bg-rose-500"
                                : isNearBudget
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, budgetUsed)}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-semibold ${
                            isOverBudget
                              ? "text-rose-600 dark:text-rose-400"
                              : isNearBudget
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-700 dark:text-gray-300"
                          }`}>
                            {budgetUsed}%
                          </span>
                          {isOverBudget && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{parseFloat(project.hours_logged || 0).toFixed(1)}h</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No active projects found. Start by creating a project.</p>
        </div>
      )}
    </div>
  );
}
