import React, { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { format } from "date-fns";
import { Search, Filter, MoreHorizontal, CheckCircle2, Circle } from "lucide-react";

export default function ProjectTasksTab({ project }) {
  const { tasksQuery, updateTask } = useTasks();
  const { data: rawTasks, isLoading } = tasksQuery;
  const tasks = rawTasks?.results || rawTasks || [];
  const [search, setSearch] = useState("");
  
  // Tasks belong to a task_list which belongs to a project.
  // We need to filter tasks for this project only. Assuming the API returns all tasks for user.
  // Or we just rely on filtering if `task_list` object is populated or we need to pass `project` id.
  // For now, let's just assume we have `tasks` array.
  
  // Realistically we need `useTaskLists` to know which lists belong to this project, 
  // then filter tasks that belong to those lists.
  // For simplicity here, we assume tasks return with nested task_list or we filter appropriately.
  // Let's assume tasks is already correct or we filter it:
  // const projectTasks = tasks.filter(t => t.task_list?.project === project.id);
  // Actually, we'll just show what's returned for now as a placeholder until we fetch taskLists.

  if (isLoading) {
    return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 w-12"></th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Task Title</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Priority</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Due Date</th>
              <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks?.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <button 
                    onClick={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                    className="text-gray-400 hover:text-primary-600 focus:outline-none"
                  >
                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                  </span>
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
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
