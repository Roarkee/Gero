import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import { FiPlus, FiMoreVertical, FiClock } from "react-icons/fi";
import api from "../services/api";
import toast from "react-hot-toast";

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

    if (activeId !== overId) {
      try {
        // Find which list the task is being moved to
        const targetList = taskLists.find(
          (list) =>
            list.tasks?.some((task) => task.id === overId) || list.id === overId
        );

        if (targetList) {
          await api.patch(`/tasks/${activeId}/`, {
            task_list: targetList.id,
          });
          fetchProjectData(); // Refresh data
          toast.success("Task moved successfully");
        }
      } catch (error) {
        toast.error("Failed to move task");
      }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
        <p className="text-gray-600">{project?.description}</p>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {taskLists.map((list) => (
            <div key={list.id} className="flex-shrink-0 w-80">
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
                  <div className="space-y-3 min-h-[200px] rounded-lg p-2">
                    {list.tasks?.map((task) => (
                      <SortableTask key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>

                <button className="w-full mt-3 p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center justify-center">
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add a task
                </button>
              </div>
            </div>
          ))}

          {/* Add new list */}
          <div className="flex-shrink-0 w-80">
            <button className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors duration-200">
              <FiPlus className="w-6 h-6 mr-2" />
              Add a list
            </button>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
