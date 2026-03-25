import { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
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

function TimeTrackerButton({ taskId }) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isRunning = activeTimer?.task === taskId;

  const handleToggle = () => {
    if (isRunning) {
      stopTimer.mutate(activeTimer.id);
    } else {
      startTimer.mutate({ taskId });
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
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6"); // Default blue

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const { data: allLabels } = useLabels();
  const createLabel = useCreateLabel();

  // Sync state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  if (!task) return null;

  const isSyncing = String(task.id).startsWith("temp-");

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

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      await createLabel.mutateAsync({
        name: newLabelName,
        color: newLabelColor,
        project: projectId,
      });
      setNewLabelName("");
      toast.success("Label created");
    } catch (error) {
      toast.error("Failed to create label");
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
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
                      <p className="text-sm text-gray-500 mt-1 px-2 -ml-2">
                        in list{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {task.task_list_name || "Unknown List"}
                        </span>
                      </p>
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
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.labels?.map((label) => (
                            <span
                              key={label.id}
                              className="h-6 px-3 rounded text-xs font-semibold text-white flex items-center shadow-sm"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                          <button
                            onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
                            className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Label Popover (Simplified inline for MVP) */}
                        {isLabelMenuOpen && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 absolute z-10 w-64 animate-in fade-in zoom-in-95 duration-200">
                            <h5 className="text-sm font-semibold mb-2">
                              Labels
                            </h5>
                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar mb-3">
                              {allLabels
                                ?.filter(
                                  (l) =>
                                    l.project === projectId ||
                                    l.project.id === projectId,
                                )
                                .map((label) => {
                                  const isActive = task.labels?.some(
                                    (tl) => tl.id === label.id,
                                  );
                                  return (
                                    <div
                                      key={label.id}
                                      onClick={() => toggleLabel(label)}
                                      className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                                    >
                                      <div
                                        className="w-4 h-4 rounded-sm"
                                        style={{ backgroundColor: label.color }}
                                      />
                                      <span className="text-sm flex-1">
                                        {label.name}
                                      </span>
                                      {isActive && (
                                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                              <input
                                placeholder="New label name"
                                className="w-full text-xs p-1.5 rounded border border-gray-200 dark:border-gray-600 mb-2"
                                value={newLabelName}
                                onChange={(e) =>
                                  setNewLabelName(e.target.value)
                                }
                              />
                              <div className="flex gap-1 mb-2">
                                {[
                                  "#ef4444",
                                  "#eab308",
                                  "#22c55e",
                                  "#3b82f6",
                                  "#a855f7",
                                ].map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => setNewLabelColor(color)}
                                    className={clsx(
                                      "w-5 h-5 rounded-full border-2",
                                      newLabelColor === color
                                        ? "border-gray-400"
                                        : "border-transparent",
                                    )}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <Button
                                size="sm"
                                className="w-full text-xs"
                                onClick={handleCreateLabel}
                              >
                                Create
                              </Button>
                            </div>
                          </div>
                        )}
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
                              {Math.floor((task.total_minutes || 0) / 60)}h{" "}
                              {(task.total_minutes || 0) % 60}m
                            </span>
                          </div>
                          <div className="pt-2">
                            <TimeTrackerButton taskId={task.id} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this task?",
                              )
                            ) {
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
