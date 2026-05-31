import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";

export const useProjectIntelligence = (projectId) => {
  const overviewQuery = useQuery({
    queryKey: ["projectOverview", projectId],
    queryFn: () => projectsApi.getProjectOverview(projectId),
    enabled: !!projectId,
  });

  const healthQuery = useQuery({
    queryKey: ["projectHealth", projectId],
    queryFn: () => projectsApi.getProjectHealth(projectId),
    enabled: !!projectId,
  });

  const budgetQuery = useQuery({
    queryKey: ["projectBudget", projectId],
    queryFn: () => projectsApi.getProjectBudget(projectId),
    enabled: !!projectId,
  });

  const deliveryQuery = useQuery({
    queryKey: ["projectDelivery", projectId],
    queryFn: () => projectsApi.getProjectDelivery(projectId),
    enabled: !!projectId,
  });

  const productivityQuery = useQuery({
    queryKey: ["projectProductivity", projectId],
    queryFn: () => projectsApi.getProjectProductivity(projectId),
    enabled: !!projectId,
  });

  const profitabilityQuery = useQuery({
    queryKey: ["projectProfitability", projectId],
    queryFn: () => projectsApi.getProjectProfitability(projectId),
    enabled: !!projectId,
  });

  return {
    overviewQuery,
    healthQuery,
    budgetQuery,
    deliveryQuery,
    productivityQuery,
    profitabilityQuery,
  };
};
