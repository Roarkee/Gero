import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import { useTaskLists, useTasks } from "../hooks/useTasks";
import TaskList from "./TaskList";
import TaskDetailDrawer from "./TaskDetailDrawer";

export default function ProjectBoardTab({ project }) {
  const { createTaskList } = useTaskLists();
  const { updateTask } = useTasks();

  const [taskLists, setTaskLists] = useState([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  // Sync state from project data (project.task_lists already populated by backend)
  useEffect(() => {
    if (project?.task_lists) {
      const sortedLists = [...project.task_lists].sort(
        (a, b) => a.position - b.position,
      );
      setTaskLists(
        sortedLists.map((list) => ({
          ...list,
          tasks: [...(list.tasks || [])].sort((a, b) => a.position - b.position),
        })),
      );
    }
  }, [project]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createTaskList.mutateAsync({
        name: newListName,
        project: project.id,
        list_type: "custom",
        position: taskLists.length,
      });
      toast.success("List created");
      setNewListName("");
      setIsCreatingList(false);
    } catch (error) {
      toast.error("Failed to create list");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTaskId = active.id;
    const overTaskId = over.id;

    let sourceListIndex = -1;
    let destListIndex = -1;
    let sourceTaskIndex = -1;
    let destTaskIndex = -1;

    taskLists.forEach((list, listIdx) => {
      list.tasks.forEach((task, taskIdx) => {
        if (task.id === activeTaskId) {
          sourceListIndex = listIdx;
          sourceTaskIndex = taskIdx;
        }
        if (task.id === overTaskId) {
          destListIndex = listIdx;
          destTaskIndex = taskIdx;
        }
      });
    });

    if (sourceListIndex === -1) return;

    const newLists = [...taskLists];
    const [movedTask] = newLists[sourceListIndex].tasks.splice(sourceTaskIndex, 1);

    if (destListIndex !== -1) {
      newLists[destListIndex].tasks.splice(destTaskIndex, 0, movedTask);
    } else {
      const listId = over.id;
      const targetListIndex = newLists.findIndex((l) => `list-${l.id}` === listId);
      if (targetListIndex !== -1) {
        newLists[targetListIndex].tasks.push(movedTask);
        destListIndex = targetListIndex; // Used for saving
      } else {
        // Did not drop on a valid list, revert visually
        setTaskLists([...project.task_lists]);
        return;
      }
    }

    setTaskLists(newLists);

    try {
      if (sourceListIndex !== destListIndex) {
        await updateTask.mutateAsync({
          id: activeTaskId,
          task_list: newLists[destListIndex].id,
        });
      }

      const updatePromises = newLists[destListIndex].tasks.map((task, index) =>
        updateTask.mutateAsync({ id: task.id, position: index }),
      );

      if (sourceListIndex !== destListIndex) {
        newLists[sourceListIndex].tasks.forEach((task, index) => {
          updatePromises.push(
            updateTask.mutateAsync({ id: task.id, position: index }),
          );
        });
      }

      await Promise.all(updatePromises);
    } catch (error) {
      if (project?.task_lists) setTaskLists(project.task_lists);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="inline-flex gap-4 p-6 min-h-full items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={taskLists.map((list) => list.id)}
              strategy={horizontalListSortingStrategy}
            >
              {taskLists.map((list) => (
                <TaskList
                  key={list.id}
                  list={list}
                  projectId={project.id}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="w-72 flex-shrink-0">
            {isCreatingList ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <input
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 mb-3"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateList();
                    if (e.key === "Escape") setIsCreatingList(false);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateList}
                    disabled={!newListName.trim()}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex-1 transition-colors"
                  >
                    Add List
                  </button>
                  <button
                    onClick={() => setIsCreatingList(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add another list</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <TaskDetailDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
      />
    </div>
  );
}
