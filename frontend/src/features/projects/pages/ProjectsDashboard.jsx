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
          <h1 className="text-3xl font-heading font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            Projects
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your client projects and track progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-neon flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-neon-purple border border-primary-400/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-dark-card backdrop-blur-md text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 transition-all shadow-[0_0_15px_rgba(0,240,255,0.05)]"
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-dark-card border border-white/10 p-1 rounded-lg backdrop-blur-md">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-all ${
              view === "grid"
                ? "bg-primary-500/20 shadow-[0_0_10px_rgba(0,240,255,0.2)] text-primary-400 border border-primary-500/30"
                : "text-gray-500 hover:text-white border border-transparent"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-all ${
              view === "list"
                ? "bg-primary-500/20 shadow-[0_0_10px_rgba(0,240,255,0.2)] text-primary-400 border border-primary-500/30"
                : "text-gray-500 hover:text-white border border-transparent"
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
                    className="block glass-card p-6 rounded-xl border border-white/10 hover:border-primary-500/50 transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-primary-300 transition-colors">
                        {project.name}
                      </h3>
                      {/* Top badge: shows backend status value */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0 ml-2 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 relative z-10">
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
            <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-400">Project Name</th>
                    <th className="px-6 py-4 font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-400">Client</th>
                    <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProjects.map((project) => {
                    const statusConfig = getStatusConfig(project);
                    return (
                      <tr key={project.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <Link to={`/projects/${project.id}`} className="font-medium text-gray-300 group-hover:text-primary-400 transition-colors">
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          {/* Issue 6 fix: use real status config in list view too */}
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium shadow-[0_0_10px_rgba(255,255,255,0.05)] ${statusConfig.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {project.client_name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/projects/${project.id}`} className="text-primary-500 hover:text-primary-400 hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] font-medium transition-all">
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
