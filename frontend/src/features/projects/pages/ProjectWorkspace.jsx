import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import { useProjects } from "../hooks/useProjects";
import {
  LayoutDashboard,
  Trello,
  ListTodo,
  Clock,
  DollarSign,
  Activity,
  BarChart2,
  Paperclip,
  ArrowLeft,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import ProjectOverviewTab from "../components/ProjectOverviewTab";
import ProjectBoardTab from "../components/ProjectBoardTab";
import ProjectTasksTab from "../components/ProjectTasksTab";
import ProjectTimeTrackingTab from "../components/ProjectTimeTrackingTab";
import ProjectBudgetTab from "../components/ProjectBudgetTab";
import ProjectIntelligenceTab from "../components/ProjectIntelligenceTab";
import ProjectActivityTab from "../components/ProjectActivityTab";
import ProjectFilesTab from "../components/ProjectFilesTab";
import { getStatusConfig, STATUS_OPTIONS } from "../utils/projectStatus";

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const { projectQuery } = useProject(projectId);
  const { data: project, isLoading } = projectQuery;
  const { updateProject } = useProjects();

  const [activeTab, setActiveTab] = useState("overview");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { deleteProject } = useProjects();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="p-6 text-center text-gray-500">Project not found</div>;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, component: ProjectOverviewTab },
    { id: "board", label: "Board", icon: Trello, component: ProjectBoardTab },
    { id: "tasks", label: "Tasks", icon: ListTodo, component: ProjectTasksTab },
    { id: "time", label: "Time Tracking", icon: Clock, component: ProjectTimeTrackingTab },
    { id: "budget", label: "Budget", icon: DollarSign, component: ProjectBudgetTab },
    { id: "intelligence", label: "Intelligence", icon: BarChart2, component: ProjectIntelligenceTab },
    { id: "activity", label: "Activity", icon: Activity, component: ProjectActivityTab },
    { id: "files", label: "Files", icon: Paperclip, component: ProjectFilesTab },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || ProjectOverviewTab;

  // Issue 2 fix: allow status changes via dropdown
  const handleStatusChange = async (newStatus) => {
    if (newStatus === project.status) {
      setIsStatusOpen(false);
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await updateProject.mutateAsync({ id: project.id, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusOpen(false);
    }
  };

  // Issue 6 fix: use real status config
  const statusConfig = getStatusConfig(project);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted successfully");
      // React Query will handle cache invalidation and navigation via useProjects hook (or we can navigate manually if needed)
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete project. Ensure no invoices are attached.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="px-6 pt-6">
          <div className="flex items-center mb-4">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>

            {/* Issue 2 fix: clickable status dropdown */}
            <div className="relative ml-4">
              <button
                onClick={() => setIsStatusOpen((o) => !o)}
                disabled={isUpdatingStatus}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 disabled:opacity-50 ${statusConfig.badgeClass}`}
              >
                {isUpdatingStatus ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dotColor}`} />
                )}
                {statusConfig.label}
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </button>

              {isStatusOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    {STATUS_OPTIONS.map((opt) => {
                      const cfg = getStatusConfig({ status: opt.value });
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            project.status === opt.value ? "font-semibold" : ""
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${cfg.dotColor}`} />
                          {opt.label}
                          {project.status === opt.value && (
                            <span className="ml-auto text-primary-500 text-xs">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            
            {/* Delete Project Button */}
            <div className="ml-auto">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center pb-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <ActiveComponent project={project} />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4 text-red-600 dark:text-red-500">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Delete Project?</h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                <p>This will permanently delete:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Project details and settings</li>
                  <li>Tasks, task lists, and subtasks</li>
                  <li>Project files and attachments</li>
                  <li>Project-specific activity history</li>
                </ul>
                <p className="font-semibold mt-4 text-red-600 dark:text-red-400">
                  This action cannot be undone.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Projects with finalized invoices cannot be deleted. Expense records will be detached but retained in your financial history.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
