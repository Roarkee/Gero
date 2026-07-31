import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { Plus, LayoutGrid, List as ListIcon, Search } from "lucide-react";
import CreateProjectModal from "../CreateProjectModal";
import { getStatusConfig } from "../utils/projectStatus";

export default function ProjectsDashboard() {
  const { projectsQuery } = useProjects();
  const { data: rawProjects, isLoading } = projectsQuery;
  const projects = rawProjects?.results || rawProjects || [];

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your client projects and track progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-colors ${
              view === "grid"
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-colors ${
              view === "list"
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary-600"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No projects found</p>
          <p className="text-sm">Create your first project to get started.</p>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                // Issue 6 fix: derive status config from real project data
                const statusConfig = getStatusConfig(project);
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {project.name}
                      </h3>
                      {/* Top badge: shows backend status value */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-2 ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                      {project.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      {/* Issue 6 fix: footer indicator derived from status, not hardcoded */}
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dotColor}`}></span>
                        {statusConfig.label}
                      </div>
                      {project.due_date && (
                        <span className="text-xs">
                          Due {new Date(project.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Project Name</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => {
                    const statusConfig = getStatusConfig(project);
                    return (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/projects/${project.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          {/* Issue 6 fix: use real status config in list view too */}
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {project.client_name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/projects/${project.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      </div>
    </div>
  );
}
