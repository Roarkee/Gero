import React from "react";
import { useProjectActivities } from "../hooks/useProjects";
import { format } from "date-fns";
import { CheckCircle2, Clock, Play, Square, FilePlus, Users, PlusCircle, RefreshCw } from "lucide-react";

export default function ProjectActivityTab({ project }) {
  const { activitiesQuery } = useProjectActivities(project.id);
  const { data: rawActivities, isLoading } = activitiesQuery;
  const activities = rawActivities?.results || rawActivities || [];

  const projectActivities = activities.filter(a => a.project === project.id);

  if (isLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const getIcon = (type) => {
    switch(type) {
      case 'project_created': case 'project_updated': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'task_created': return <PlusCircle className="w-5 h-5 text-green-500" />;
      case 'task_updated': case 'task_moved': return <RefreshCw className="w-5 h-5 text-yellow-500" />;
      case 'task_completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'timer_started': return <Play className="w-5 h-5 text-primary-500" />;
      case 'timer_stopped': return <Square className="w-5 h-5 text-gray-500" />;
      case 'file_uploaded': return <FilePlus className="w-5 h-5 text-purple-500" />;
      case 'member_added': return <Users className="w-5 h-5 text-indigo-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Activity History</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">A chronological timeline of everything happening in {project.name}.</p>
        </div>
        <div className="p-6">
          {projectActivities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No activities found.</p>
          ) : (
            <div className="space-y-8">
              {projectActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start group">
                  {index !== projectActivities.length - 1 && (
                    <div className="absolute top-8 bottom-[-2rem] left-4 w-0.5 bg-gray-200 dark:bg-gray-700 group-last:hidden"></div>
                  )}
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mr-4">
                    {getIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(activity.created_at), "MMMM d, yyyy 'at' h:mm a")} • {activity.user_email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
