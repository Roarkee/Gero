import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "../hooks/useProjects";
import {
  LayoutDashboard,
  Trello,
  ListTodo,
  Clock,
  DollarSign,
  Activity,
  BarChart2,
  Paperclip,
  ArrowLeft
} from "lucide-react";

import ProjectOverviewTab from "../components/ProjectOverviewTab";
import ProjectBoardTab from "../components/ProjectBoardTab";
import ProjectTasksTab from "../components/ProjectTasksTab";
import ProjectTimeTrackingTab from "../components/ProjectTimeTrackingTab";
import ProjectBudgetTab from "../components/ProjectBudgetTab";
import ProjectIntelligenceTab from "../components/ProjectIntelligenceTab";
import ProjectActivityTab from "../components/ProjectActivityTab";
import ProjectFilesTab from "../components/ProjectFilesTab";

export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const { projectQuery } = useProject(projectId);
  const { data: project, isLoading } = projectQuery;

  const [activeTab, setActiveTab] = useState("overview");

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

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 pt-6">
          <div className="flex items-center mb-4">
            <Link to="/projects" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <span className="ml-4 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {project.status}
            </span>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex space-x-6 overflow-x-auto mt-6">
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
      <div className="flex-1 overflow-auto">
        <ActiveComponent project={project} />
      </div>
    </div>
  );
}
