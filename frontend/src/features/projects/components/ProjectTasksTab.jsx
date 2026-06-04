import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { format } from "date-fns";
import { Search, Filter, MoreHorizontal, CheckCircle2, Circle, Edit2, Trash2, ChevronDown, Check } from "lucide-react";
import TaskDetailDrawer from "./TaskDetailDrawer";
import toast from "react-hot-toast";

export default function ProjectTasksTab({ project }) {
  const { updateTask, deleteTask } = useTasks();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, completed
  const [priorityFilter, setPriorityFilter] = useState("all"); // all, low, medium, high, urgent
  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Get tasks belong to this project's lists
  const allTasks = (project?.task_lists || []).flatMap((tl) => 
    (tl.tasks || []).map(task => ({
      ...task,
      listName: tl.name
    }))
  );

  // Filter tasks
  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" ? true :
      statusFilter === "completed" ? task.completed : !task.completed;
      
    const matchesPriority = priorityFilter === "all" ? true :
      task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleDelete = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const activeTask = selectedTask
    ? allTasks.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {(statusFilter !== "all" || priorityFilter !== "all") && (
              <span className="ml-2 w-2 h-2 rounded-full bg-primary-600" />
            )}
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 p-4 space-y-4">
              <div>
                <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Status</span>
                <div className="space-y-1.5">
                  {["all", "active", "completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-sm ${statusFilter === status ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 dark:text-gray-300"}`}
                    >
                      <span className="capitalize">{status}</span>
                      {statusFilter === status && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Priority</span>
                <div className="space-y-1.5">
                  {["all", "low", "medium", "high", "urgent"].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setPriorityFilter(priority)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-sm ${priorityFilter === priority ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 dark:text-gray-300"}`}
                    >
                      <span className="capitalize">{priority}</span>
                      {priorityFilter === priority && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 w-12"></th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Task Title</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">List</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Priority</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Due Date</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  No tasks match the active filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 valign-top align-top">
                    <button 
                      onClick={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                      className="text-gray-400 hover:text-primary-600 focus:outline-none"
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedTask(task)}>
                    <div className="space-y-1">
                      <span className={`font-medium block ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{task.description}</p>
                      )}
                      
                      {/* Subtasks inline with completed strike-through */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          {task.subtasks.map((sub) => {
                            const isSubCompleted = sub.completed || task.completed;
                            return (
                              <div key={sub.id} className="flex items-center text-xs space-x-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSubCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <span className={`${isSubCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {sub.todo}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {task.listName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : '-'}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => setSelectedTask(task)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TaskDetailDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={activeTask}
      />
    </div>
  );
}
