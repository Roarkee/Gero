import React from "react";
import { useProjectIntelligence } from "../hooks/useProjectIntelligence";
import { useProjectActivities } from "../hooks/useProjects";
import { useTimeTracking } from "../hooks/useTimeTracking";
import { CheckCircle2, AlertCircle, Clock, DollarSign, Activity, Calendar, Play } from "lucide-react";
import { format } from "date-fns";

export default function ProjectOverviewTab({ project }) {
  const { overviewQuery, healthQuery } = useProjectIntelligence(project.id);
  const { activitiesQuery } = useProjectActivities(project.id);
  const { activeTimerQuery } = useTimeTracking();

  const overview = overviewQuery.data || {};
  const health = healthQuery.data || {};
  const rawActivities = activitiesQuery.data;
  const activities = rawActivities?.results || rawActivities || [];
  const activeTimer = activeTimerQuery.data;
  // console.log(activities);
  // Filter activities for this project
  const projectActivities = activities?.filter(a => a.project === project.id).slice(0, 5);
  
  // Calculate metrics from nested intelligence data
  const completionPercent = overview.productivity?.completion_percentage || 0;
  const activeTasks = overview.delivery?.remaining_tasks || 0;
  const overdueTasks = overview.delivery?.overdue_tasks || 0;
  
  // Convert minutes to hours
  const totalLoggedHours = Math.round((overview.productivity?.time_logged_minutes || 0) / 60 * 10) / 10;
  const estimatedHours = 0; // The intelligence API doesn't seem to return estimated hours currently

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{completionPercent}%</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4 dark:bg-gray-700">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activeTasks}</h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm mt-3 text-orange-600 dark:text-orange-400 font-medium">
            {overdueTasks} Overdue
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hours Logged</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalLoggedHours}h</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">
            Est: {estimatedHours}h
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Health Score</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{health.health_score || 'N/A'}</h3>
            </div>
            <div className={`p-2 rounded-lg ${
              health.risk_level === 'high' ? 'bg-red-50 text-red-600' : 
              health.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-600' : 
              'bg-green-50 text-green-600'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm mt-3 text-gray-500 dark:text-gray-400 capitalize">
            Risk: {health.risk_level || 'Low'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity & Timers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Timer (if belongs to this project) */}
          {activeTimer && (activeTimer.project === project.id || activeTimer.project_name === project.name) && (
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5 rounded-xl shadow-md text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-full mr-4 animate-pulse">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h4 className="font-medium text-primary-50">Active Timer</h4>
                  <p className="text-lg font-bold">{activeTimer.task_title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-100">Started at</p>
                <p className="font-medium">{format(new Date(activeTimer.start_time), "h:mm a")}</p>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <div className="p-5">
              {projectActivities.length > 0 ? (
                <div className="space-y-6">
                  {projectActivities.map((activity, idx) => (
                    <div key={activity.id} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
                        {idx !== projectActivities.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"></div>
                        )}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(new Date(activity.created_at), "MMM d, h:mm a")} • by {activity.user_email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No recent activity.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Deadlines */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-500" />
                Upcoming Deadlines
              </h3>
            </div>
            <div className="p-5">
              {/* Normally we'd filter tasks from useTasks, but we'll leave a placeholder for the actual task data integration */}
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p className="text-sm">Connect tasks to view deadlines</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
