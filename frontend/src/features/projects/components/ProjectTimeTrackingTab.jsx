import React, { useState } from "react";
import { useTimeTracking } from "../hooks/useTimeTracking";
import { format } from "date-fns";
import { Play, Square, Clock } from "lucide-react";

export default function ProjectTimeTrackingTab({ project }) {
  const { timeEntriesQuery, activeTimerQuery, startTimer, stopTimer } = useTimeTracking();
  const { data: rawTimeEntries, isLoading } = timeEntriesQuery;
  const timeEntries = rawTimeEntries?.results || rawTimeEntries || [];
  const activeTimer = activeTimerQuery.data;

  // Filter entries for this project
  // Ensure the backend returns `project` ID in TimeEntrySerializer, which it does.
  const projectEntries = timeEntries.filter(t => t.project === project.id);

  if (isLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const isTimerRunningForProject = activeTimer && activeTimer.project === project.id;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Active Timer Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${isTimerRunningForProject ? 'bg-primary-100 text-primary-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isTimerRunningForProject ? "Timer is running" : "Ready to track time?"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isTimerRunningForProject ? `Tracking for: ${activeTimer.task_title}` : "Select a task on the board to start a timer."}
            </p>
          </div>
        </div>
        {isTimerRunningForProject && (
          <div className="flex items-center space-x-6">
            <div className="text-2xl font-mono text-gray-900 dark:text-white">
              {/* Simplistic active time display */}
              {activeTimer.start_time ? format(new Date(activeTimer.start_time), "h:mm a") : "Active"}
            </div>
            <button 
              onClick={() => stopTimer.mutate(activeTimer.id)}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Square className="w-4 h-4 mr-2" fill="currentColor" />
              Stop Timer
            </button>
          </div>
        )}
      </div>

      {/* Time Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-900 dark:text-white">Time Log</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Task</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Description</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projectEntries.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No time logged yet.</td>
              </tr>
            ) : (
              projectEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 dark:text-white text-sm">
                    {format(new Date(entry.start_time), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white text-sm font-medium">
                    {entry.task_title}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {entry.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white text-sm text-right font-medium">
                    {entry.duration_minutes} min
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
