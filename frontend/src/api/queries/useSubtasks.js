import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Create subtask
export const useCreateSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtaskData) => {
      const response = await apiClient.post(
        API_ENDPOINTS.SUBTASKS,
        subtaskData,
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate project to refresh the board/task view
      // We assume variables includes projectId if available, or we might need to invalidate all projects
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

// Update subtask
export const useUpdateSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.SUBTASK_DETAIL(id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

// Delete subtask
export const useDeleteSubtask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(API_ENDPOINTS.SUBTASK_DETAIL(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
