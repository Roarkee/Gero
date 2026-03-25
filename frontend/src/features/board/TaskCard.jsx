import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  CheckSquare,
  AlertCircle,
  Play,
  Square,
  Timer,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { clsx } from "clsx";
import {
  useStartTimer,
  useStopTimer,
  useActiveTimer,
} from "../../api/queries/useTimeTracking";

export default function TaskCard({ task, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: "text-gray-500",
    medium: "text-yellow-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  };

  const completedSubtasks =
    task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  // Time Tracking Logic
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isRunning = activeTimer?.task === task.id;
  const isSyncing = String(task.id).startsWith("temp-");

  const handleTimerClick = (e) => {
    e.stopPropagation(); // Prevent opening modal
    if (isRunning) {
      stopTimer.mutate(activeTimer.id);
    } else {
      startTimer.mutate({ taskId: task.id });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        "bg-white dark:bg-gray-700 rounded-lg p-3 shadow-soft hover:shadow-medium transition-all duration-200 cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-600 group",
        isDragging && "opacity-50 rotate-2 scale-105 shadow-large",
        isRunning && "ring-2 ring-indigo-500 border-indigo-500",
      )}
    >
      {/* Labels & Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap gap-1">
          {task.labels?.map((label) => (
            <span
              key={label.id}
              className="h-1.5 w-6 rounded-full"
              style={{ backgroundColor: label.color || "#e2e8f0" }}
              title={label.name}
            />
          ))}
        </div>

        {/* Timer Button (Visible on hover or if running) */}
        <button
          onClick={handleTimerClick}
          className={clsx(
            "p-1.5 rounded-full transition-colors",
            isRunning
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 opacity-100"
              : "opacity-0 group-hover:opacity-100 bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600",
          )}
          title={isRunning ? "Stop Timer" : "Start Timer"}
        >
          {isRunning ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 leading-snug">
        {task.title}
      </h4>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
        {/* Priority Badge */}
        {task.priority && task.priority !== "low" && (
          <div
            className={clsx(
              "flex items-center gap-1",
              priorityColors[task.priority],
            )}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="capitalize">{task.priority}</span>
          </div>
        )}

        {/* Due Date */}
        {task.duedate && (
          <div
            className={clsx(
              "flex items-center gap-1",
              isPast(new Date(task.duedate)) &&
                "text-red-600 dark:text-red-400",
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(task.duedate), "MMM d")}</span>
          </div>
        )}

        {/* Subtasks */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}

        {/* Total Time */}
        {(task.total_minutes > 0 || isRunning) && (
          <div
            className={clsx(
              "flex items-center gap-1",
              isRunning && "text-indigo-600 dark:text-indigo-400 font-medium",
            )}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>
              {Math.floor((task.total_minutes || 0) / 60)}h{" "}
              {(task.total_minutes || 0) % 60}m{isRunning && " (Active)"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
