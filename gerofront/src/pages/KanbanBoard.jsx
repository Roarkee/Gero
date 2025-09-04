import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { FiPlus, FiMoreVertical, FiClock, FiArrowLeft } from "react-icons/fi";
import api from "../services/api";
import toast from "react-hot-toast";

// Droppable List Component
const DroppableList = ({ list, onAddTask }) => {
  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{list.name}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {list.tasks?.length || 0}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              <FiMoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <SortableContext
          items={list.tasks?.map((task) => task.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div
            ref={setNodeRef}
            className="space-y-3 min-h-[200px] rounded-lg p-2 border-2 border-dashed border-transparent hover:border-gray-300 transition-colors"
            data-list-id={list.id}
          >
            {list.tasks?.map((task) => (
              <SortableTask key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        <button
          onClick={() => onAddTask(list.id)}
          className="w-full mt-3 p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Add a task
        </button>
      </div>
    </div>
  );
};

// Sortable Task Component
const SortableTask = ({ task }) => {
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 rotate-3 shadow-lg" : ""
      }`}
    >
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.labels?.map((label) => (
            <span
              key={label.id}
              className="px-2 py-1 text-xs rounded-full"
              style={{
                backgroundColor: label.color + "20",
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>

        {task.duedate && (
          <div className="flex items-center text-xs text-gray-500">
            <FiClock className="w-3 h-3 mr-1" />
            {new Date(task.duedate).toLocaleDateString()}
          </div>
        )}
      </div>

      {task.subtasks?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {task.subtasks.filter((st) => st.completed).length} /{" "}
            {task.subtasks.length} subtasks
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className="bg-primary-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (task.subtasks.filter((st) => st.completed).length /
                    task.subtasks.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

const KanbanBoard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });
  const [newList, setNewList] = useState({
    name: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const response = await api.get(`/projects/${id}/`);
      setProject(response.data);
      setTaskLists(response.data.task_lists || []);
    } catch (error) {
      toast.error("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    try {
      // Find the active task
      let activeTask = null;
      let sourceList = null;

      for (const list of taskLists) {
        const task = list.tasks?.find((t) => t.id === activeId);
        if (task) {
          activeTask = task;
          sourceList = list;
          break;
        }
      }

      if (!activeTask) return;

      // Determine target list
      let targetList = null;

      // Check if dropped on a task (move to that task's list)
      for (const list of taskLists) {
        if (list.tasks?.some((task) => task.id === overId)) {
          targetList = list;
          break;
        }
      }

      // Check if dropped on a list directly
      if (!targetList) {
        targetList = taskLists.find((list) => list.id === overId);
      }

      if (targetList && targetList.id !== sourceList.id) {
        // Update task's list
        await api.patch(`/tasks/${activeId}/`, {
          task_list: targetList.id,
        });

        // Optimistically update UI
        setTaskLists((prevLists) => {
          return prevLists.map((list) => {
            if (list.id === sourceList.id) {
              // Remove task from source list
              return {
                ...list,
                tasks: list.tasks?.filter((task) => task.id !== activeId) || [],
              };
            } else if (list.id === targetList.id) {
              // Add task to target list
              return {
                ...list,
                tasks: [...(list.tasks || []), activeTask],
              };
            }
            return list;
          });
        });

        toast.success("Task moved successfully");
      }
    } catch (error) {
      console.error("Failed to move task:", error);
      toast.error("Failed to move task");
      // Refresh data on error to revert optimistic update
      fetchProjectData();
    }
  };

  const handleAddTask = (listId) => {
    setSelectedListId(listId);
    setShowAddTaskModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks/", {
        ...newTask,
        task_list: selectedListId,
      });
      toast.success("Task created successfully!");
      setShowAddTaskModal(false);
      setNewTask({ title: "", description: "" });
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasklists/", {
        ...newList,
        project: id,
      });
      toast.success("Task list created successfully!");
      setShowAddListModal(false);
      setNewList({ name: "" });
      fetchProjectData();
    } catch (error) {
      toast.error("Failed to create task list");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Projects
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {project?.name}
            </h1>
            <p className="text-gray-600">{project?.description}</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {taskLists.map((list) => (
            <DroppableList
              key={list.id}
              list={list}
              onAddTask={handleAddTask}
            />
          ))}

          {/* Add new list */}
          <div className="flex-shrink-0 w-80">
            <button
              onClick={() => setShowAddListModal(true)}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors duration-200"
            >
              <FiPlus className="w-6 h-6 mr-2" />
              Add a list
            </button>
          </div>
        </div>
      </DndContext>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Task
            </h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Task List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Task List
            </h2>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  value={newList.name}
                  onChange={(e) =>
                    setNewList({ ...newList, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., To Do, In Progress, Done"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddListModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add List
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
