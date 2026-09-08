import { useState, useEffect } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import LabelPopover from "./LabelPopover";
import { useProject } from "../../api/queries/useProjects";
import { useUpdateTask, useDeleteTask } from "../../api/queries/useTasks";
import {
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "../../api/queries/useSubtasks";
import { useLabels, useCreateLabel } from "../../api/queries/useLabels";
import { Button } from "../../components/ui";
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
  Tag,
  AlignLeft,
  Clock,
  Timer,
  Play,
  Square,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { clsx } from "clsx";
import {
  useStartTimer,
  useStopTimer,
  useActiveTimer,
} from "../../api/queries/useTimeTracking";

function TimeTrackerButton({ taskId, projectId }) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isRunning = activeTimer?.task === taskId;

  const handleToggle = () => {
    if (isRunning) {
      stopTimer.mutate(activeTimer.id);
    } else {
      startTimer.mutate({ taskId,projectId });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors w-full justify-center",
        isRunning
          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400",
      )}
    >
      {isRunning ? (
        <Square className="w-4 h-4 fill-current" />
      ) : (
        <Play className="w-4 h-4 fill-current" />
      )}
      {isRunning ? "Stop Timer" : "Start Timer"}
    </button>
  );
}

export default function TaskDetailModal({ isOpen, onClose, task, projectId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const { data: allLabels } = useLabels();
  const createLabel = useCreateLabel();
  const { data: project } = useProject(projectId);
  const { data: activeTimer } = useActiveTimer();

  const isRunning = activeTimer?.task === task?.id;
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning && activeTimer?.start_time) {
      const start = new Date(activeTimer.start_time).getTime();
      const calculate = () => {
        const now = new Date().getTime();
        setElapsedMinutes(Math.floor((now - start) / 60000));
      };
      calculate(); // Initial
      interval = setInterval(calculate, 60000);
    } else {
      setElapsedMinutes(0);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTimer]);

  const displayMinutes = (task?.total_minutes || 0) + elapsedMinutes;

  // Sync state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  if (!task) return null;

  const isSyncing = String(task.id).startsWith("temp-");

  const handleUpdateList = async (newListId) => {
    if (isSyncing) return;
    const newListIdNum = Number(newListId);
    if (newListIdNum !== task.task_list) {
      try {
        await updateTask.mutateAsync({ id: task.id, data: { task_list: newListIdNum } });
        toast.success("Task moved");
      } catch (error) {
        toast.error("Failed to move task");
      }
    }
  };

  const handleUpdateTitle = async () => {
    if (isSyncing) {
      toast("Please wait for task to sync...");
      return;
    }
    if (title !== task.title) {
      try {
        await updateTask.mutateAsync({ id: task.id, data: { title } });
        toast.success("Title updated");
      } catch (error) {
        setTitle(task.title);
        toast.error("Failed to update title");
      }
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDescription = async () => {
    if (description !== task.description) {
      try {
        await updateTask.mutateAsync({ id: task.id, data: { description } });
        toast.success("Description saved");
      } catch (error) {
        toast.error("Failed to save description");
      }
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      await createSubtask.mutateAsync({
        todo: newSubtask,
        task: task.id,
        completed: false,
      });
      setNewSubtask("");
      toast.success("Subtask added");
    } catch (error) {
      toast.error("Failed to add subtask");
    }
  };

  const toggleSubtask = async (subtask) => {
    try {
      await updateSubtask.mutateAsync({
        id: subtask.id,
        data: { completed: !subtask.completed },
      });
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (id) => {
    try {
      await deleteSubtask.mutateAsync(id);
      toast.success("Subtask deleted");
    } catch (error) {
      toast.error("Failed to delete subtask");
    }
  };

  const toggleLabel = async (label) => {
    const hasLabel = task.labels?.some((l) => l.id === label.id);
    let newLabels;

    if (hasLabel) {
      newLabels = task.labels.filter((l) => l.id !== label.id).map((l) => l.id);
    } else {
      newLabels = [...(task.labels?.map((l) => l.id) || []), label.id];
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { labels: newLabels },
      });
    } catch (error) {
      toast.error("Failed to update labels");
    }
  };

  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress =
    totalSubtasks === 0
      ? 0
      : Math.round((completedSubtasks / totalSubtasks) * 100);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
                {/* Header covering image (optional) or just color bar */}
                <div className="h-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                  {isSyncing && (
                    <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>
                        Syncing with server... some actions may be disabled.
                      </span>
                    </div>
                  )}

                  {/* Title Section */}
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <div className="flex-1">
                      {isEditingTitle ? (
                        <input
                          autoFocus
                          className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-indigo-500 focus:outline-none pb-1"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onBlur={handleUpdateTitle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTitle();
                          }}
                        />
                      ) : (
                        <h2
                          onClick={() => setIsEditingTitle(true)}
                          className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-2 -ml-2 py-1 transition-colors"
                        >
                          {task.title}
                        </h2>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mt-1 px-2 -ml-2 gap-2">
                        in list
                        <select
                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-emerald-500 focus:border-emerald-500 block p-1 font-medium transition-colors"
                          value={task.task_list || ""}
                          onChange={(e) => handleUpdateList(e.target.value)}
                          disabled={isSyncing || !project?.task_lists}
                        >
                          {!project?.task_lists && (
                            <option value={task.task_list}>{task.task_list_name || "Unknown List"}</option>
                          )}
                          {project?.task_lists?.map((list) => (
                            <option key={list.id} value={list.id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,250px] gap-8">
                    {/* Main Content */}
                    <div className="space-y-8">
                      {/* Description */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-200 font-semibold">
                          <AlignLeft className="w-5 h-5" />
                          <h3>Description</h3>
                        </div>
                        <textarea
                          placeholder="Add a more detailed description..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all resize-y min-h-[100px]"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          onBlur={handleUpdateDescription}
                        />
                      </div>

                      {/* Subtasks */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-semibold">
                            <CheckSquare className="w-5 h-5" />
                            <h3>Subtasks</h3>
                          </div>
                          {totalSubtasks > 0 && (
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {Math.round(progress)}%
                            </span>
                          )}
                        </div>

                        {totalSubtasks > 0 && (
                          <div className="mb-4 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}

                        <div className="space-y-2 mb-4">
                          {task.subtasks?.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={subtask.completed}
                                onChange={() => toggleSubtask(subtask)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span
                                className={clsx(
                                  "flex-1 text-sm text-gray-700 dark:text-gray-300 break-words",
                                  subtask.completed &&
                                    "line-through text-gray-400",
                                )}
                              >
                                {subtask.todo}
                              </span>
                              <button
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-1 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <form
                          onSubmit={handleAddSubtask}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Add an item"
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                          />
                          <Button
                            size="sm"
                            type="submit"
                            disabled={!newSubtask.trim()}
                          >
                            Add
                          </Button>
                        </form>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Labels */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Labels
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {task.labels?.map((label) => (
                            <span
                              key={label.id}
                              className="h-6 px-3 rounded text-xs font-semibold text-white flex items-center shadow-sm"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                          <LabelPopover 
                            allLabels={allLabels?.filter(l => l.project === projectId || l.project.id === projectId) || []}
                            selectedLabels={task.labels?.map(l => l.id) || []}
                            onToggleLabel={toggleLabel}
                            onCreateLabel={async (data) => {
                              await createLabel.mutateAsync({
                                ...data,
                                project: projectId,
                              });
                            }}
                            triggerNode={
                              <button className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            }
                          />
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Details
                        </h4>
                        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          {task.duedate && (
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span>
                                Due{" "}
                                {format(new Date(task.duedate), "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              Created{" "}
                              {task.created_at
                                ? format(
                                    new Date(task.created_at),
                                    "MMM d, yyyy",
                                  )
                                : "Just now"}
                            </span>
                          </div>

                          {/* Time Tracking Detail */}
                          <div className="flex items-center gap-2">
                            <Timer className="w-4 h-4 text-gray-400" />
                            <span>
                              Total:{" "}
                              {Math.floor(displayMinutes / 60)}h{" "}
                              {displayMinutes % 60}m{isRunning && " (Active)"}
                            </span>
                          </div>
                          <div className="pt-2">
                            <TimeTrackerButton taskId={task.id} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        <Button
                          variant="ghost"
                          className={clsx(
                            "w-full justify-start",
                            task.completed
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                              : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          )}
                          onClick={async () => {
                            try {
                              await updateTask.mutateAsync({ id: task.id, data: { completed: !task.completed } });
                              toast.success(task.completed ? "Task marked as incomplete" : "Task marked as complete");
                            } catch {
                              toast.error("Failed to update task");
                            }
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this task?")) {
                              deleteTask.mutate(task.id);
                              onClose();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
