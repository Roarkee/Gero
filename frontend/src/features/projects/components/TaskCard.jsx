import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast } from "date-fns";
import { AlertCircle, Clock, CheckSquare, Timer, Play, Square } from "lucide-react";
import { useTimeTracking } from "../hooks/useTimeTracking";

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

  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const { activeTimerQuery, startTimer, stopTimer } = useTimeTracking();
  const activeTimer = activeTimerQuery.data;
  const isRunning = activeTimer?.task === task.id;

  const handleTimerClick = (e) => {
    e.stopPropagation();
    if (isRunning) {
      stopTimer.mutate(activeTimer.id);
    } else {
      startTimer.mutate({ task_id: task.id });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-700 group ${
        isDragging ? "opacity-50 rotate-2 scale-105 shadow-xl" : ""
      } ${isRunning ? "ring-2 ring-primary-500 border-primary-500" : ""} ${task.completed ? "opacity-60" : ""}`}
    >
      {/* Header: Labels & Actions */}
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
        
        <button
          onClick={handleTimerClick}
          className={`p-1.5 rounded-md transition-colors ${
            isRunning
              ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 opacity-100"
              : "opacity-0 group-hover:opacity-100 bg-gray-50 text-gray-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-primary-900/20"
          }`}
        >
          {isRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-medium mb-2 leading-snug ${task.completed ? "text-gray-500 line-through" : "text-gray-900 dark:text-white"}`}>
        {task.title}
      </h4>

      {/* Footer Metrics */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap mt-3">
        {task.priority && task.priority !== "low" && (
          <div className={`flex items-center gap-1 ${priorityColors[task.priority]}`}>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        )}

        {task.due_date && (
          <div className={`flex items-center gap-1 ${isPast(new Date(task.due_date)) && !task.completed ? "text-red-600 dark:text-red-400" : ""}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(task.due_date), "MMM d")}</span>
          </div>
        )}

        {totalSubtasks > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{completedSubtasks}/{totalSubtasks}</span>
          </div>
        )}

        {(task.total_minutes > 0 || isRunning) && (
          <div className={`flex items-center gap-1 ml-auto ${isRunning ? "text-primary-600 font-medium" : ""}`}>
            <Timer className="w-3.5 h-3.5" />
            <span>
              {Math.floor((task.total_minutes || 0) / 60)}h {(task.total_minutes || 0) % 60}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
