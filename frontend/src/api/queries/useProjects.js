import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Fetch all projects
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PROJECTS);
      return response.data.results || response.data;
    },
  });
};

// Fetch single project with details
export const useProject = (projectId) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.PROJECT_DETAIL(projectId),
      );
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Create project
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData) => {
      const response = await apiClient.post(
        API_ENDPOINTS.PROJECTS,
        projectData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.PROJECT_DETAIL(id),
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId) => {
      await apiClient.delete(API_ENDPOINTS.PROJECT_DETAIL(projectId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
