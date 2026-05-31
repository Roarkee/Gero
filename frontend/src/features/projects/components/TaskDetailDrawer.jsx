import React, { useState } from "react";
import { useTasks, useSubtasks } from "../hooks/useTasks";
import { useTimeTracking } from "../hooks/useTimeTracking";
import { format } from "date-fns";
import { X, Play, Square, CheckCircle2, Circle, Clock, Tag, Calendar, AlignLeft, ListTodo, Activity } from "lucide-react";

export default function TaskDetailDrawer({ task, isOpen, onClose }) {
  if (!isOpen || !task) return null;

  const { updateTask } = useTasks();
  const { createSubtask, updateSubtask } = useSubtasks();
  const { activeTimerQuery, startTimer, stopTimer, timeEntriesQuery } = useTimeTracking();

  const [newSubtask, setNewSubtask] = useState("");
  
  const activeTimer = activeTimerQuery.data;
  const isTimerRunning = activeTimer && activeTimer.task === task.id;

  const rawTimeEntries = timeEntriesQuery.data;
  const timeEntries = rawTimeEntries?.results || rawTimeEntries || [];
  const taskTimeEntries = timeEntries.filter(t => t.task === task.id);
  const totalMinutes = taskTimeEntries.reduce((acc, curr) => acc + curr.duration_minutes, 0);

  const handleCompleteTask = () => {
    updateTask.mutate({ id: task.id, completed: !task.completed });
  };

  const handleAddSubtask = (e) => {
    if (e.key === 'Enter' && newSubtask.trim()) {
      createSubtask.mutate({ todo: newSubtask, task: task.id });
      setNewSubtask("");
    }
  };

  const handleToggleSubtask = (subtaskId, completed) => {
    updateSubtask.mutate({ id: subtaskId, completed: !completed });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleCompleteTask}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                task.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {task.completed ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Circle className="w-4 h-4 mr-2" />}
              {task.completed ? 'Completed' : 'Mark Complete'}
            </button>
            
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.priority}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Title */}
          <div>
            <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${task.completed ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </h2>
          </div>

          {/* Time Tracking Action */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
              <Clock className="w-5 h-5 mr-3 text-primary-500" />
              <span>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m logged</span>
            </div>
            {isTimerRunning ? (
              <button 
                onClick={() => stopTimer.mutate(activeTimer.id)}
                className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
              >
                <Square className="w-4 h-4 mr-2" fill="currentColor" /> Stop
              </button>
            ) : (
              <button 
                onClick={() => startTimer.mutate({ task_id: task.id })}
                className="flex items-center px-3 py-1.5 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-md text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4 mr-2" fill="currentColor" /> Start
              </button>
            )}
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> Due Date
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-medium pl-6">
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <Tag className="w-4 h-4 mr-2" /> Labels
              </p>
              <div className="flex flex-wrap gap-1 pl-6">
                {task.labels && task.labels.length > 0 ? (
                  task.labels.map(label => (
                    <span key={label.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${label.color}30`, color: label.color }}>
                      {label.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None</span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <AlignLeft className="w-4 h-4 mr-2" /> Description
            </h3>
            <p className="text-sm text-gray-900 dark:text-gray-300 whitespace-pre-wrap pl-6">
              {task.description || "No description provided."}
            </p>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <ListTodo className="w-4 h-4 mr-2" /> Subtasks
            </h3>
            <div className="pl-6 space-y-2">
              {task.subtasks && task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center group">
                  <button 
                    onClick={() => handleToggleSubtask(subtask.id, subtask.completed)}
                    className="text-gray-400 hover:text-primary-600 focus:outline-none mr-3"
                  >
                    {subtask.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-300'}`}>
                    {subtask.todo}
                  </span>
                </div>
              ))}
              <div className="flex items-center pt-2">
                <Circle className="w-5 h-5 text-gray-300 mr-3" />
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={handleAddSubtask}
                  className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 p-0"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
