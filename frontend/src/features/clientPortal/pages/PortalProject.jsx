import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft, MessageSquare, Paperclip, FileText, Receipt,
  CheckCircle2, Circle, Clock
} from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";
import MessagesTab from "../components/MessagesTab";
import FilesTab from "../components/FilesTab";
import ProposalsTab from "../components/ProposalsTab";
import InvoicesTab from "../components/InvoicesTab";

const TABS = [
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "files",    label: "Files",    icon: Paperclip },
  { id: "proposals",label: "Proposals",icon: FileText },
  { id: "invoices", label: "Invoices", icon: Receipt },
];

const statusColors = {
  active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  inactive:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function ProgressBar({ value }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
      <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function PortalProject() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("messages");

  const { data: project, isLoading } = useQuery({
    queryKey: ["portal", "project", id],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_PROJECT_DETAIL(id));
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-gray-500 p-6">Project not found.</div>;
  }

  const totalTasks = project.task_lists?.reduce((s, l) => s + l.total, 0) ?? 0;
  const doneTasks  = project.task_lists?.reduce((s, l) => s + l.done,  0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All projects
      </Link>

      {/* Project header card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">{project.description}</p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0 ${statusColors[project.status] || statusColors.inactive}`}>
            {project.status}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>{doneTasks} of {totalTasks} tasks complete</span>
            <span>{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {project.start_date && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Started {format(new Date(project.start_date), "MMM d, yyyy")}
            </span>
          )}
          {project.due_date && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Due {format(new Date(project.due_date), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Task lists summary */}
      {project.task_lists?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {project.task_lists.map((list) => (
            <div key={list.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 truncate">{list.name}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{list.total}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{list.done} done</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "messages"  && <MessagesTab  projectId={id} />}
          {activeTab === "files"     && <FilesTab     projectId={id} />}
          {activeTab === "proposals" && <ProposalsTab projectId={id} />}
          {activeTab === "invoices"  && <InvoicesTab  projectId={id} />}
        </div>
      </div>
    </div>
  );
}
