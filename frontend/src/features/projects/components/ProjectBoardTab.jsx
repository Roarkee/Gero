import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Plus, X } from "lucide-react";
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

  // Ref for the horizontally scrolling board container
  const boardRef = useRef(null);
  const addListInputRef = useRef(null);

  // Sync state from project data
  useEffect(() => {
    if (project?.task_lists) {
      const sortedLists = [...project.task_lists].sort(
        (a, b) => a.position - b.position
      );
      setTaskLists(
        sortedLists.map((list) => ({
          ...list,
          tasks: [...(list.tasks || [])].sort((a, b) => a.position - b.position),
        }))
      );
    }
  }, [project]);

  // Shift+Wheel → horizontal scroll
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Let native horizontal scroll pass through (trackpad two-finger swipe)
      if (e.deltaX !== 0) return;
      // Shift+scroll OR just vertical scroll on the board → convert to horizontal
      if (e.shiftKey || e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY || e.deltaX;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // After creating a new list, scroll to the "Add List" column
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = boardRef.current;
      if (el) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      }
    });
  }, []);

  const handleCreateList = async () => {
    if (!newListName.trim() || createTaskList.isPending) return;
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
      scrollToEnd();
    } catch {
      toast.error("Failed to create list");
    }
  };

  // When the "Add list" button is clicked, open form AND scroll to it
  const handleOpenCreateForm = () => {
    setIsCreatingList(true);
    scrollToEnd();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
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
        if (task.id === activeTaskId) { sourceListIndex = listIdx; sourceTaskIndex = taskIdx; }
        if (task.id === overTaskId)   { destListIndex   = listIdx; destTaskIndex   = taskIdx; }
      });
    });

    if (sourceListIndex === -1) return;

    const newLists = [...taskLists];
    const [movedTask] = newLists[sourceListIndex].tasks.splice(sourceTaskIndex, 1);

    if (destListIndex !== -1) {
      newLists[destListIndex].tasks.splice(destTaskIndex, 0, movedTask);
    } else {
      const targetListIndex = newLists.findIndex((l) => `list-${l.id}` === over.id);
      if (targetListIndex !== -1) {
        newLists[targetListIndex].tasks.push(movedTask);
        destListIndex = targetListIndex;
      } else {
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
        updateTask.mutateAsync({ id: task.id, position: index })
      );

      if (sourceListIndex !== destListIndex) {
        newLists[sourceListIndex].tasks.forEach((task, index) => {
          updatePromises.push(updateTask.mutateAsync({ id: task.id, position: index }));
        });
      }

      await Promise.all(updatePromises);
    } catch {
      if (project?.task_lists) setTaskLists(project.task_lists);
    }
  };

  const activeTask = selectedTask
    ? taskLists.flatMap((l) => l.tasks || []).find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/*
        Board scroll container.
        - overflow-x: auto  → horizontal scrollbar appears when columns exceed width
        - overflow-y: hidden → vertical overflow is each column's responsibility
        - flex: 1           → fills the full height of this container
      */}
      <div
        ref={boardRef}
        style={{ flex: "1 1 0%", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}
        className="custom-scrollbar"
      >
        {/*
          Inner strip.
          - display: inline-flex → the element is exactly as wide as its children.
            Unlike flex (which is block), inline-flex does NOT stretch to fill the parent,
            so overflow-x: auto on the parent actually triggers the scrollbar.
          - min-height: 100% → fills vertical space so the background colour looks right
          - padding-bottom: 2rem → breathing room above the scrollbar
        */}
        <div
          className="inline-flex flex-nowrap items-start gap-4 p-6"
          style={{ minHeight: "100%", paddingBottom: "2rem" }}
        >
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

          {/* Add List Column — always the last child, always reachable */}
          <div className="flex-shrink-0 w-72">
            {isCreatingList ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <input
                  ref={addListInputRef}
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none mb-3"
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
                    disabled={!newListName.trim() || createTaskList.isPending}
                    className="flex-1 bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {createTaskList.isPending ? "Adding..." : "Add List"}
                  </button>
                  <button
                    onClick={() => setIsCreatingList(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenCreateForm}
                className="w-full h-12 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-all flex items-center justify-center gap-2 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add another list
              </button>
            )}
          </div>
        </div>
      </div>

      <TaskDetailDrawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={activeTask}
        projectId={project.id}
      />
    </div>
  );
}
