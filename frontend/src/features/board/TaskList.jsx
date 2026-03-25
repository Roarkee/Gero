import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  useCreateTask,
  useDeleteTaskList,
  useUpdateTaskList,
} from "../../api/queries/useTasks";
import { useLabels } from "../../api/queries/useLabels";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  MoreHorizontal,
  Trash2,
  Pencil,
  Calendar,
  AlertCircle,
  Tag,
} from "lucide-react";

export default function TaskList({ list, projectId, onTaskClick }) {
  const { setNodeRef } = useDroppable({
    id: `list-${list.id}`,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Renaming state
  const [isRenaming, setIsRenaming] = useState(false);
  const [listName, setListName] = useState(list.name);

  const createTask = useCreateTask();
  const deleteTaskList = useDeleteTaskList();
  const updateTaskList = useUpdateTaskList();
  const { data: allLabels } = useLabels();

  const handleRename = async () => {
    if (!listName.trim() || listName === list.name) {
      setIsRenaming(false);
      setListName(list.name);
      return;
    }
    try {
      await updateTaskList.mutateAsync({
        id: list.id,
        data: { name: listName },
      });
      toast.success("List renamed");
      setIsRenaming(false);
    } catch (error) {
      toast.error("Failed to rename list");
    }
  };

  const projectLabels =
    allLabels?.filter(
      (l) => l.project === projectId || l.project.id === projectId,
    ) || [];

  const handleCreate = async () => {
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }

    try {
      await createTask.mutateAsync({
        title,
        task_list: list.id,
        priority, // 'low', 'medium', 'high', 'urgent'
        duedate: dueDate || null,
        labels: selectedLabels,
        optimisticLabels:
          allLabels?.filter((l) => selectedLabels.includes(l.id)) || [],
        projectId,
        position: list.tasks?.length || 0,
      });
      setTitle("");
      setPriority("medium");
      setDueDate("");
      setSelectedLabels([]);
      setIsAdding(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add task");
    }
  };

  const handleDeleteList = async () => {
    if (
      confirm(
        "Are you sure you want to delete this list? All tasks in it will be lost.",
      )
    ) {
      try {
        await deleteTaskList.mutateAsync(list.id);
        toast.success("List deleted");
      } catch (error) {
        toast.error("Failed to delete list");
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col max-h-full">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col max-h-full border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* List Header */}
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
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setListName(list.name);
                }
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
            <Menu.Button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-100 dark:border-gray-700">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsRenaming(true)}
                        className={`${
                          active
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
                            : "text-gray-700 dark:text-gray-300"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename List
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDeleteList}
                        className={`${
                          active
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                            : "text-gray-700 dark:text-gray-300"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete List
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Tasks Container */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-2 min-h-[50px]"
        >
          <SortableContext
            items={list.tasks?.map((task) => task.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
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
                {/* Priority Selector */}
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

                {/* Due Date */}
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

              {/* Labels */}
              {projectLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {projectLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => {
                        if (selectedLabels.includes(label.id)) {
                          setSelectedLabels(
                            selectedLabels.filter((id) => id !== label.id),
                          );
                        } else {
                          setSelectedLabels([...selectedLabels, label.id]);
                        }
                      }}
                      className={`h-1.5 w-6 rounded-full transition-all ring-1 ${selectedLabels.includes(label.id) ? "ring-offset-1 ring-indigo-500 scale-110" : "ring-transparent opacity-60 hover:opacity-100"}`}
                      style={{ backgroundColor: label.color }}
                      title={label.name}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700 font-medium"
                >
                  Add Card
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

        {/* Add Card Button */}
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
