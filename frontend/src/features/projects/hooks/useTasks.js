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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: invalidate completion metrics whenever a task is updated
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: projectsApi.deleteTask,
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      // Issue 1 fix: subtask changes also affect completion metrics
      queryClient.invalidateQueries({ queryKey: ["projectOverview"] });
      queryClient.invalidateQueries({ queryKey: ["projectHealth"] });
    },
  });

  const updateSubtask = useMutation({
    mutationFn: projectsApi.updateSubtask,
    onSuccess: () => {
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
