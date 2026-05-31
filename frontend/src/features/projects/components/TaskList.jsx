import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { Plus, X, MoreHorizontal, Trash2, Pencil, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { useTaskLists, useTasks } from "../hooks/useTasks";
import { useLabels } from "../../../api/queries/useLabels"; // assuming this exists for now, or use static
import TaskCard from "./TaskCard";

export default function TaskList({ list, projectId, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });
  
  const { updateTaskList, deleteTaskList } = useTaskLists();
  const { createTask } = useTasks();
  const { data: allLabels } = useLabels();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [listName, setListName] = useState(list.name);

  const projectLabels = allLabels?.filter((l) => l.project === projectId) || [];

  const handleRename = async () => {
    if (!listName.trim() || listName === list.name) {
      setIsRenaming(false);
      setListName(list.name);
      return;
    }
    try {
      await updateTaskList.mutateAsync({ id: list.id, name: listName });
      toast.success("List renamed");
      setIsRenaming(false);
    } catch {
      toast.error("Failed to rename list");
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) { setIsAdding(false); return; }
    try {
      await createTask.mutateAsync({
        title,
        task_list: list.id,
        priority,
        duedate: dueDate || null,
        labels: selectedLabels,
        project: projectId, // Ensure it's linked
        position: list.tasks?.length || 0,
      });
      setTitle(""); setPriority("medium"); setDueDate(""); setSelectedLabels([]);
      setIsAdding(false);
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleDeleteList = async () => {
    if (confirm("Are you sure you want to delete this list?")) {
      try {
        await deleteTaskList.mutateAsync(list.id);
        toast.success("List deleted");
      } catch {
        toast.error("Failed to delete list");
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleCreateTask(); }
    if (e.key === "Escape") setIsAdding(false);
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col max-h-full">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col max-h-full border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header */}
        <div className="p-3 flex items-center justify-between group cursor-grab active:cursor-grabbing border-b border-transparent">
          {isRenaming ? (
            <input
              autoFocus
              className="font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-2 py-1 rounded w-full text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setIsRenaming(false); setListName(list.name); }
              }}
            />
          ) : (
            <h3
              className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 cursor-pointer flex-1 py-1 px-1"
              onClick={() => setIsRenaming(true)}
            >
              {list.name}
              <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {list.tasks?.length || 0}
              </span>
            </h3>
          )}

          <Menu as="div" className="relative ml-2">
            <MenuButton className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </MenuButton>
            <MenuItems className="absolute right-0 mt-1 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="p-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => setIsRenaming(true)}
                      className={`${focus ? "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"} flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Pencil className="mr-2 h-4 w-4 text-gray-400" /> Rename
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleDeleteList}
                      className={`${focus ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "text-red-600 dark:text-red-400"} flex w-full items-center rounded-md px-2 py-2 text-sm mt-1`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>

        {/* Tasks Container */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-2 min-h-[10px]"
        >
          <SortableContext
            items={list.tasks?.map((task) => task.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks?.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </SortableContext>

          {isAdding && (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-primary-200 dark:border-primary-900/30 space-y-3">
              <textarea
                autoFocus
                className="w-full text-sm p-2 rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <select
                    className="appearance-none pl-7 pr-2 py-1 text-xs rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-primary-500 outline-none"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <AlertCircle className="w-3 h-3 text-gray-400 absolute left-2 top-1.5" />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    className="pl-7 pr-2 py-1 text-xs rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-primary-500 outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Calendar className="w-3 h-3 text-gray-400 absolute left-2 top-1.5" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreateTask}
                  className="bg-primary-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary-700 font-medium transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 p-1.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Button Footer */}
        {!isAdding && (
          <div className="p-2 pt-0">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
