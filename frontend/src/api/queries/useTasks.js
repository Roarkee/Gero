import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Create task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, ...taskData }) => {
      const response = await apiClient.post(API_ENDPOINTS.TASKS, taskData);
      return response.data;
    },
    onMutate: async (newTask) => {
      // Optimistic update
      const projectId = String(newTask.projectId);
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });

      const previousProject = queryClient.getQueryData(["project", projectId]);

      if (previousProject) {
        queryClient.setQueryData(["project", projectId], (old) => {
          const listIndex = old.task_lists.findIndex(
            (list) => list.id === newTask.task_list,
          );
          if (listIndex !== -1) {
            const updatedLists = [...old.task_lists];
            updatedLists[listIndex] = {
              ...updatedLists[listIndex],
              tasks: [
                ...updatedLists[listIndex].tasks,
                {
                  ...newTask,
                  id: "temp-" + Date.now(),
                  created_at: new Date().toISOString(),
                  labels: newTask.optimisticLabels || [], // Use full label objects for UI
                  duedate: newTask.optimisticDueDate || newTask.duedate || null,
                  priority: newTask.priority || "medium",
                },
              ],
            };
            return { ...old, task_lists: updatedLists };
          }
          return old;
        });
      }

      return { previousProject };
    },
    onError: (err, newTask, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          ["project", String(newTask.projectId)],
          context.previousProject,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Update task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.TASK_DETAIL(id),
        data,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Delete task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      await apiClient.delete(API_ENDPOINTS.TASK_DETAIL(taskId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

// Create task list
export const useCreateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listData) => {
      const response = await apiClient.post(API_ENDPOINTS.TASK_LISTS, listData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.project],
      });
    },
  });
};

// Update task list
export const useUpdateTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.TASK_LIST_DETAIL(id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

// Delete task list
export const useDeleteTaskList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId) => {
      await apiClient.delete(API_ENDPOINTS.TASK_LIST_DETAIL(listId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
