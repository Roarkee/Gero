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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProjects = queryClient.getQueriesData({ queryKey: ["project"] });
      
      queryClient.setQueriesData({ queryKey: ["project"] }, (old) => {
        if (!old || !old.task_lists) return old;
        return {
          ...old,
          task_lists: old.task_lists.map(list => ({
            ...list,
            tasks: list.tasks.map(task => {
               if (!task.subtasks) return task;
               return {
                 ...task,
                 subtasks: task.subtasks.map(sub => 
                   sub.id === id ? { ...sub, ...data } : sub
                 )
               };
            })
          }))
        };
      });
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProjects = queryClient.getQueriesData({ queryKey: ["project"] });
      
      queryClient.setQueriesData({ queryKey: ["project"] }, (old) => {
        if (!old || !old.task_lists) return old;
        return {
          ...old,
          task_lists: old.task_lists.map(list => ({
            ...list,
            tasks: list.tasks.map(task => {
               if (!task.subtasks) return task;
               return {
                 ...task,
                 subtasks: task.subtasks.filter(sub => sub.id !== id)
               };
            })
          }))
        };
      });
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
