import React, { useState } from "react";
import { useTimeTracking } from "../hooks/useTimeTracking";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { Play, Square, Clock, Plus, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

function formatMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function ProjectTimeTrackingTab({ project }) {
  const {
    timeEntriesQuery,
    activeTimerQuery,
    startTimer,
    stopTimer,
    createTimeEntry,
    deleteTimeEntry,
  } = useTimeTracking();

  const { data: rawTimeEntries, isLoading } = timeEntriesQuery;
  const timeEntries = rawTimeEntries?.results || rawTimeEntries || [];
  const activeTimer = activeTimerQuery.data;

  // Filter entries for this project (includes only stopped entries with duration)
  const projectEntries = timeEntries
    .filter((t) => t.project == project.id && !t.is_running)
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const isTimerRunningForProject = activeTimer && activeTimer.project === project.id;

  // Elapsed time counter display
  const [elapsedDisplay, setElapsedDisplay] = useState("");
  React.useEffect(() => {
    if (!isTimerRunningForProject) { setElapsedDisplay(""); return; }
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(activeTimer.start_time).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsedDisplay(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunningForProject, activeTimer]);

  // Manual entry state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTask, setManualTask] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  const handleStopTimer = async () => {
    try {
      await stopTimer.mutateAsync(activeTimer.id);
      toast.success("Timer stopped — entry logged");
    } catch {
      toast.error("Failed to stop timer");
    }
  };

  const handleManualEntry = async () => {
    if (!manualTask || !manualDate || !manualStart || !manualEnd) {
      toast.error("Please fill in task, date, start and end time");
      return;
    }
    const startIso = `${manualDate}T${manualStart}:00`;
    const endIso = `${manualDate}T${manualEnd}:00`;
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("End time must be after start time");
      return;
    }
    setIsSavingManual(true);
    try {
      await createTimeEntry.mutateAsync({
        task: parseInt(manualTask),
        project: project.id,
        start_time: startIso,
        end_time: endIso,
        description: manualDesc,
        is_billable: true,
      });
      toast.success("Time entry logged");
      setShowManualForm(false);
      setManualTask(""); setManualDesc(""); setManualStart(""); setManualEnd("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to log time entry");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      await deleteTimeEntry.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const totalMinutes = projectEntries.reduce((acc, e) => acc + e.duration_minutes, 0);
  const billableMinutes = projectEntries.filter((e) => e.is_billable).reduce((acc, e) => acc + e.duration_minutes, 0);

  // Collect all tasks from the project for the manual entry selector
  const allTasks = (project.task_lists || []).flatMap((tl) => tl.tasks || []);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Summary KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logged</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatMins(totalMinutes)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Billable</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{formatMins(billableMinutes)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entries</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{projectEntries.length}</p>
        </div>
      </div>

      {/* Active Timer Section */}
      <div className={`rounded-xl border shadow-sm p-6 flex items-center justify-between transition-colors ${
        isTimerRunningForProject
          ? "bg-primary-600 border-primary-700 text-white"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${isTimerRunningForProject ? "bg-white/20 animate-pulse" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
            <Clock className={`w-8 h-8 ${isTimerRunningForProject ? "text-white" : ""}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isTimerRunningForProject ? "text-white" : "text-gray-900 dark:text-white"}`}>
              {isTimerRunningForProject ? "Timer is running" : "Ready to track time?"}
            </h3>
            <p className={`text-sm ${isTimerRunningForProject ? "text-primary-100" : "text-gray-500 dark:text-gray-400"}`}>
              {isTimerRunningForProject
                ? `Task: ${activeTimer.task_title}`
                : "Start a timer from the Board, or log time manually below."}
            </p>
          </div>
        </div>

        {isTimerRunningForProject && (
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-primary-200 mb-0.5">Elapsed</p>
              <div className="text-3xl font-mono font-bold text-white tabular-nums">
                {elapsedDisplay}
              </div>
            </div>
            <button
              onClick={handleStopTimer}
              disabled={stopTimer.isPending}
              className="flex items-center px-5 py-2.5 bg-white text-primary-700 hover:bg-primary-50 rounded-xl font-semibold text-sm transition-colors shadow disabled:opacity-50"
            >
              {stopTimer.isPending ? (
                <span className="w-4 h-4 mr-2 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" fill="currentColor" />
              )}
              Stop & Save
            </button>
          </div>
        )}
      </div>

      {/* Time Entries Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-900 dark:text-white">Time Log</h3>
          <button
            onClick={() => setShowManualForm((v) => !v)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 rounded-lg transition-colors"
          >
            {showManualForm ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            {showManualForm ? "Cancel" : "Add Manual Entry"}
          </button>
        </div>

        {/* Manual Entry Form */}
        {showManualForm && (
          <div className="p-6 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Task *</label>
                <select
                  value={manualTask}
                  onChange={(e) => setManualTask(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Select a task…</option>
                  {allTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Start time *</label>
                <input
                  type="time"
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">End time *</label>
                <input
                  type="time"
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleManualEntry}
                  disabled={isSavingManual}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSavingManual ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Log Entry
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Task</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Description</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Billable</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm text-right">Duration</th>
              <th className="px-6 py-4 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projectEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No time logged yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start a timer on the Board or add a manual entry.</p>
                </td>
              </tr>
            ) : (
              projectEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {format(new Date(entry.start_time), "MMM d, yyyy")}
                    <br />
                    <span className="text-xs text-gray-400">
                      {format(new Date(entry.start_time), "h:mm a")}
                      {entry.end_time && ` → ${format(new Date(entry.end_time), "h:mm a")}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{entry.task_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{entry.description || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      entry.is_billable
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      {entry.is_billable ? "Billable" : "Non-billable"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatMins(entry.duration_minutes)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
