import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, ChevronRight, AlertCircle } from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

const statusColors = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-3">
      <div
        className="bg-indigo-500 h-1.5 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function PortalHome() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["portal", "projects"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_PROJECTS);
      return res.data?.results ?? res.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 h-36 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No projects yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Projects shared with you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Projects</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/portal/projects/${project.id}`}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h2>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 shrink-0 mt-0.5 transition-colors" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[project.status] || statusColors.inactive}`}>
                {project.status}
              </span>
              {project.open_invoices > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {project.open_invoices} invoice{project.open_invoices > 1 ? "s" : ""} pending
                </span>
              )}
            </div>

            <ProgressBar value={project.progress} />

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {project.progress}% complete
              </span>
              {project.due_date && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Due {format(new Date(project.due_date), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
