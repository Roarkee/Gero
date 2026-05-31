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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
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
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });

  return { projectQuery };
};

export const useProjectActivities = (projectId) => {
  const activitiesQuery = useQuery({
    queryKey: ["activities"],
    queryFn: projectsApi.getActivities,
  });
  return { activitiesQuery };
};

export const useProjectAttachments = (projectId) => {
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery({
    queryKey: ["attachments"],
    queryFn: projectsApi.getAttachments,
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
