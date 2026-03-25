import { useParams, Link } from "react-router-dom";
import { useProject } from "../../api/queries/useProjects";
import { ArrowLeft, Plus } from "lucide-react";
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
import TaskList from "./TaskList";
import TaskDetailModal from "./TaskDetailModal";
import { useState, useEffect } from "react";
import { useUpdateTask, useCreateTaskList } from "../../api/queries/useTasks";
import toast from "react-hot-toast";

export default function Board() {
  const { projectId } = useParams();
  const { data: project, isLoading } = useProject(projectId);
  const updateTask = useUpdateTask();
  const createTaskList = useCreateTaskList();

  const [taskLists, setTaskLists] = useState([]);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await createTaskList.mutateAsync({
        name: newListName,
        project: projectId,
        list_type: "custom",
        position: taskLists.length,
      });
      toast.success("List created");
      setNewListName("");
      setIsCreatingList(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create list");
    }
  };

  // Update local state when project data loads
  useEffect(() => {
    if (project?.task_lists) {
      const sortedLists = [...project.task_lists].sort(
        (a, b) => a.position - b.position,
      );
      setTaskLists(
        sortedLists.map((list) => ({
          ...list,
          tasks: [...list.tasks].sort((a, b) => a.position - b.position),
        })),
      );
    }
  }, [project]);

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

    // Find source and destination lists
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

    // Create new state
    const newLists = [...taskLists];
    const [movedTask] = newLists[sourceListIndex].tasks.splice(
      sourceTaskIndex,
      1,
    );

    // If dropped on a task, insert at that position
    if (destListIndex !== -1) {
      newLists[destListIndex].tasks.splice(destTaskIndex, 0, movedTask);
    } else {
      // Dropped on a list (droppable area)
      const listId = over.id;
      const targetListIndex = newLists.findIndex(
        (l) => `list-${l.id}` === listId,
      );
      if (targetListIndex !== -1) {
        newLists[targetListIndex].tasks.push(movedTask);
      }
    }

    // Update state immediately (optimistic)
    setTaskLists(newLists);

    // Sync with backend
    try {
      if (sourceListIndex !== destListIndex) {
        await updateTask.mutateAsync({
          id: activeTaskId,
          data: { task_list: newLists[destListIndex].id },
        });
      }

      // Update positions
      const updatePromises = newLists[destListIndex].tasks.map((task, index) =>
        updateTask.mutateAsync({ id: task.id, data: { position: index } }),
      );

      if (sourceListIndex !== destListIndex) {
        newLists[sourceListIndex].tasks.forEach((task, index) => {
          updatePromises.push(
            updateTask.mutateAsync({ id: task.id, data: { position: index } }),
          );
        });
      }

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on error
      if (project?.task_lists) {
        setTaskLists(project.task_lists);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="hidden md:block w-48">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Progress</span>
                <span className="text-indigo-600 font-bold">
                  {Math.round(
                    (taskLists.reduce(
                      (acc, list) =>
                        acc +
                        (list.list_type === "done" ? list.tasks.length : 0),
                      0,
                    ) /
                      Math.max(
                        taskLists.reduce(
                          (acc, list) => acc + list.tasks.length,
                          0,
                        ),
                        1,
                      )) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      (taskLists.reduce(
                        (acc, list) =>
                          acc +
                          (list.list_type === "done" ? list.tasks.length : 0),
                        0,
                      ) /
                        Math.max(
                          taskLists.reduce(
                            (acc, list) => acc + list.tasks.length,
                            0,
                          ),
                          1,
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="inline-flex gap-4 p-6 min-h-full">
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

          {/* Add List Button / Form */}
          <div className="w-72 flex-shrink-0">
            {isCreatingList ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-200 dark:border-indigo-500/30 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <input
                  autoFocus
                  type="text"
                  placeholder="List name..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 mb-3"
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
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    Add List
                  </button>
                  <button
                    onClick={() => setIsCreatingList(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="w-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Add another list</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        projectId={project?.id}
      />
    </div>
  );
}
