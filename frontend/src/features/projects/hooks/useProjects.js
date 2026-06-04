import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";

export const useProjects = () => {
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getProjects,
  });

  const createProject = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProject = useMutation({
    mutationFn: projectsApi.updateProject,
    onSuccess: (data) => {
      // Issue 2 fix: invalidate broadly — projectId from URL is a string, data.id is a number.
      // Invalidating ["projects"] covers the list, ["project"] covers all detail queries.
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    projectsQuery,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (projectId) => {
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });

  return { projectQuery };
};

export const useProjectActivities = (projectId) => {
  const activitiesQuery = useQuery({
    queryKey: ["activities", projectId],
    queryFn: projectsApi.getActivities,
    enabled: !!projectId,
  });
  return { activitiesQuery };
};

export const useProjectAttachments = (projectId) => {
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery({
    queryKey: ["attachments", projectId],
    queryFn: projectsApi.getAttachments,
    enabled: !!projectId,
  });

  const createAttachment = useMutation({
    mutationFn: projectsApi.createAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: projectsApi.deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
    },
  });

  return {
    attachmentsQuery,
    createAttachment,
    deleteAttachment,
  };
};
