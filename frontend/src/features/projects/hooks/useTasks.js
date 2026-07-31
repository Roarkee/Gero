import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";

export const useTaskLists = () => {
  const queryClient = useQueryClient();

  const taskListsQuery = useQuery({
    queryKey: ["taskLists"],
    queryFn: projectsApi.getTaskLists,
  });

  const createTaskList = useMutation({
    mutationFn: projectsApi.createTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskLists"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const updateTaskList = useMutation({
    mutationFn: projectsApi.updateTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskLists"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const deleteTaskList = useMutation({
    mutationFn: projectsApi.deleteTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskLists"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  return {
    taskListsQuery,
    createTaskList,
    updateTaskList,
    deleteTaskList,
  };
};

export const useTasks = () => {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: projectsApi.getTasks,
  });

  const createTask = useMutation({
    mutationFn: projectsApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: invalidate completion metrics after task changes
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: projectsApi.updateTask,
    onMutate: async (updatedTaskData) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProject = queryClient.getQueryData(["project"]);
      
      if (previousProject && previousProject.task_lists) {
        queryClient.setQueryData(["project"], old => {
          if (!old) return old;
          const newTaskLists = old.task_lists.map(list => {
            if (list.tasks.some(t => t.id === updatedTaskData.id)) {
              return {
                ...list,
                tasks: list.tasks.map(t => 
                  t.id === updatedTaskData.id ? { ...t, ...updatedTaskData } : t
                )
              };
            }
            return list;
          });
          return { ...old, task_lists: newTaskLists };
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: invalidate completion metrics whenever a task is updated
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: projectsApi.deleteTask,
    onMutate: async (deletedTaskId) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProject = queryClient.getQueryData(["project"]);
      
      if (previousProject && previousProject.task_lists) {
        queryClient.setQueryData(["project"], old => {
          if (!old) return old;
          const newTaskLists = old.task_lists.map(list => {
            return {
              ...list,
              tasks: list.tasks.filter(t => t.id !== deletedTaskId)
            };
          });
          return { ...old, task_lists: newTaskLists };
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: invalidate completion metrics after task deletion
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  return {
    tasksQuery,
    createTask,
    updateTask,
    deleteTask,
  };
};

export const useSubtasks = () => {
  const queryClient = useQueryClient();

  const createSubtask = useMutation({
    mutationFn: projectsApi.createSubtask,
    onMutate: async (newSubtaskData) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProject = queryClient.getQueryData(["project"]);
      
      if (previousProject && previousProject.task_lists) {
        queryClient.setQueryData(["project"], old => {
          if (!old) return old;
          const optimisticSubtask = { id: `temp-${Date.now()}`, ...newSubtaskData, completed: false };
          const newTaskLists = old.task_lists.map(list => {
             return {
               ...list,
               tasks: list.tasks.map(t => {
                 if (t.id === newSubtaskData.task) {
                   return {
                     ...t,
                     subtasks: [...(t.subtasks || []), optimisticSubtask]
                   };
                 }
                 return t;
               })
             };
          });
          return { ...old, task_lists: newTaskLists };
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: subtask changes also affect completion metrics
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const updateSubtask = useMutation({
    mutationFn: projectsApi.updateSubtask,
    onMutate: async (updatedSubtaskData) => {
      await queryClient.cancelQueries({ queryKey: ["project"] });
      const previousProject = queryClient.getQueryData(["project"]);
      
      if (previousProject && previousProject.task_lists) {
        queryClient.setQueryData(["project"], old => {
          if (!old) return old;
          const newTaskLists = old.task_lists.map(list => {
             return {
               ...list,
               tasks: list.tasks.map(t => {
                 if (t.subtasks && t.subtasks.some(st => st.id === updatedSubtaskData.id)) {
                   return {
                     ...t,
                     subtasks: t.subtasks.map(st => 
                       st.id === updatedSubtaskData.id ? { ...st, ...updatedSubtaskData } : st
                     )
                   };
                 }
                 return t;
               })
             };
          });
          return { ...old, task_lists: newTaskLists };
        });
      }
      return { previousProject };
    },
    onError: (err, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(["project"], context.previousProject);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: subtask completion changes completion metrics
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: projectsApi.deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  return {
    createSubtask,
    updateSubtask,
    deleteSubtask,
  };
};
