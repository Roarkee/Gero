import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import LabelPopover from "./LabelPopover";
import { useState } from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import {
  useCreateTask,
  useDeleteTaskList,
  useUpdateTaskList,
} from "../../api/queries/useTasks";
import { useLabels, useCreateLabel } from "../../api/queries/useLabels";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  MoreHorizontal,
  Trash2,
  Pencil,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function TaskList({ list, projectId, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: `list-${list.id}` });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [listName, setListName] = useState(list.name);

  const createTask = useCreateTask();
  const deleteTaskList = useDeleteTaskList();
  const updateTaskList = useUpdateTaskList();
  const { data: allLabels } = useLabels();
  const createLabelMutation = useCreateLabel();

  const handleRename = async () => {
    if (!listName.trim() || listName === list.name) {
      setIsRenaming(false);
      setListName(list.name);
      return;
    }
    try {
      await updateTaskList.mutateAsync({ id: list.id, data: { name: listName } });
      toast.success("List renamed");
      setIsRenaming(false);
    } catch {
      toast.error("Failed to rename list");
    }
  };

  const projectLabels =
    allLabels?.filter(
      (l) => l.project === projectId || l.project.id === projectId,
    ) || [];

  const handleCreate = async () => {
    if (!title.trim() || createTask.isPending) { setIsAdding(false); return; }
    try {
      await createTask.mutateAsync({
        title,
        task_list: list.id,
        priority,
        due_date: dueDate || null,
        labels: selectedLabels,
        optimisticLabels: allLabels?.filter((l) => selectedLabels.includes(l.id)) || [],
        projectId,
        position: list.tasks?.length || 0,
      });
      setTitle(""); setPriority("medium"); setDueDate(""); setSelectedLabels([]);
      setIsAdding(false);
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleDeleteList = async () => {
    if (confirm("Are you sure you want to delete this list? All tasks in it will be lost.")) {
      try {
        await deleteTaskList.mutateAsync(list.id);
        toast.success("List deleted");
      } catch {
        toast.error("Failed to delete list");
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
    if (e.key === "Escape") setIsAdding(false);
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col max-h-full">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-3 flex items-center justify-between group header-handle cursor-grab active:cursor-grabbing">
          {isRenaming ? (
            <input
              autoFocus
              className="font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-2 py-1 rounded border border-indigo-500 w-full text-sm focus:outline-none"
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
              className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 cursor-pointer flex-1 py-1"
              onClick={() => setIsRenaming(true)}
            >
              {list.name}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {list.tasks?.length || 0}
              </span>
            </h3>
          )}

          <Menu as="div" className="relative">
            <MenuButton className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-100 dark:border-gray-700">
              <div className="p-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => setIsRenaming(true)}
                      className={`${focus ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20" : "text-gray-700 dark:text-gray-300"} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename List
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleDeleteList}
                      className={`${focus ? "bg-red-50 text-red-600 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300"} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete List
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>

        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-2 min-h-[50px]"
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
            <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm border border-indigo-200 dark:border-indigo-500/50 space-y-3">
              <textarea
                autoFocus
                className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder="Enter a title for this card..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={onKeyDown}
              />

              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <select
                    className="appearance-none pl-7 pr-2 py-1 text-xs rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
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
                    className="pl-7 pr-2 py-1 text-xs rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Calendar className="w-3 h-3 text-gray-400 absolute left-2 top-1.5" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {selectedLabels.map(id => {
                  const label = projectLabels.find(l => l.id === id);
                  if (!label) return null;
                  return (
                    <span
                      key={label.id}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center shadow-sm"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  );
                })}
                <LabelPopover 
                  allLabels={projectLabels}
                  selectedLabels={selectedLabels}
                  onToggleLabel={(label) => {
                    if (selectedLabels.includes(label.id)) {
                      setSelectedLabels(selectedLabels.filter((id) => id !== label.id));
                    } else {
                      setSelectedLabels([...selectedLabels, label.id]);
                    }
                  }}
                  onCreateLabel={async (data) => {
                    await createLabelMutation.mutateAsync({
                      ...data,
                      project: projectId,
                    });
                  }}
                  triggerNode={
                    <button className="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  }
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={createTask.isPending}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {createTask.isPending ? "Adding..." : "Add Card"}
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 p-1.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {!isAdding && (
          <div className="p-2">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add a card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
