import { useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "../../api/queries/useProjects";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui";
import { Plus, Folder, Clock, Search } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import CreateProjectModal from "./CreateProjectModal";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="font-sans">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Projects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your projects and team members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none shadow-sm"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {projects && projects.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="mx-auto h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
            <Folder className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Get started by creating your first project. Track tasks, manage
            deadlines, and collaborate with your team.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl px-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects?.map((project) => (
            <motion.div variants={item} key={project.id}>
              <Link
                to={`/board/${project.id}`}
                className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1.5"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner ${
                      [
                        "bg-blue-50 text-blue-600",
                        "bg-indigo-50 text-indigo-600",
                        "bg-purple-50 text-purple-600",
                      ][project.id % 3] || "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      project.status === "active"
                        ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {project.name}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-8 flex-1 leading-relaxed">
                  {project.description ||
                    "No description provided for this project."}
                </p>

                <div className="flex items-center pt-5 border-t border-gray-50 dark:border-gray-700 mt-auto">
                  <div className="flex -space-x-3 mr-auto pl-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium"
                      >
                        U
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {format(new Date(project.updated_at), "MMM d")}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
