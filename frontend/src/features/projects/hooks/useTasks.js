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
    },
  });

  const updateTask = useMutation({
    mutationFn: projectsApi.updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: projectsApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
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
    },
  });

  const updateSubtask = useMutation({
    mutationFn: projectsApi.updateSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: projectsApi.deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  return {
    createSubtask,
    updateSubtask,
    deleteSubtask,
  };
};
