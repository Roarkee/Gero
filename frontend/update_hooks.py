import os

# Update useTasks.js
with open(r'H:\hjvhjvh\codes\Python_codes\Gero\frontend\src\api\queries\useTasks.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace useUpdateTask
new_useUpdateTask = """// Update task
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProjects = queryClient.getQueriesData({ queryKey: ["project"] });
      
      queryClient.setQueriesData({ queryKey: ["project"] }, (old) => {
        if (!old || !old.task_lists) return old;
        return {
          ...old,
          task_lists: old.task_lists.map(list => ({
            ...list,
            tasks: list.tasks.map(task => 
              task.id === id ? { ...task, ...data } : task
            )
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};"""

# Delete task optimistic update
new_useDeleteTask = """// Delete task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      await apiClient.delete(API_ENDPOINTS.TASK_DETAIL(taskId));
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProjects = queryClient.getQueriesData({ queryKey: ["project"] });
      
      queryClient.setQueriesData({ queryKey: ["project"] }, (old) => {
        if (!old || !old.task_lists) return old;
        return {
          ...old,
          task_lists: old.task_lists.map(list => ({
            ...list,
            tasks: list.tasks.filter(task => task.id !== taskId)
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
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};"""

import re
content = re.sub(r'// Update task.*?export const useUpdateTask = \(\) => \{.*?\n  \}\);\n\};\n', new_useUpdateTask + '\n', content, flags=re.DOTALL)
content = re.sub(r'// Delete task.*?export const useDeleteTask = \(\) => \{.*?\n  \}\);\n\};\n', new_useDeleteTask + '\n', content, flags=re.DOTALL)

with open(r'H:\hjvhjvh\codes\Python_codes\Gero\frontend\src\api\queries\useTasks.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Update useSubtasks.js
with open(r'H:\hjvhjvh\codes\Python_codes\Gero\frontend\src\api\queries\useSubtasks.js', 'r', encoding='utf-8') as f:
    subtask_content = f.read()

new_useUpdateSubtask = """// Update subtask
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
};"""

new_useDeleteSubtask = """// Delete subtask
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
};"""

subtask_content = re.sub(r'// Update subtask.*?export const useUpdateSubtask = \(\) => \{.*?\n  \}\);\n\};\n', new_useUpdateSubtask + '\n', subtask_content, flags=re.DOTALL)
subtask_content = re.sub(r'// Delete subtask.*?export const useDeleteSubtask = \(\) => \{.*?\n  \}\);\n\};\n', new_useDeleteSubtask + '\n', subtask_content, flags=re.DOTALL)

with open(r'H:\hjvhjvh\codes\Python_codes\Gero\frontend\src\api\queries\useSubtasks.js', 'w', encoding='utf-8') as f:
    f.write(subtask_content)

print("Optimistic hooks updated.")
