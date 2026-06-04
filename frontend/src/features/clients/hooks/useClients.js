import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as clientApi from "../api/clientApi";

// Keys
export const clientKeys = {
  all: ["clients"],
  lists: () => [...clientKeys.all, "list"],
  list: (filters) => [...clientKeys.lists(), { filters }],
  details: () => [...clientKeys.all, "detail"],
  detail: (id) => [...clientKeys.details(), id],
  dashboardIntelligence: () => [...clientKeys.all, "dashboardIntelligence"],
  clientIntelligence: (id) => [...clientKeys.all, "clientIntelligence", id],
  activities: (id) => [...clientKeys.all, "activities", id],
};

// Queries
export const useClients = (filters = {}) => {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => clientApi.fetchClients(filters),
  });
};

export const useClientDetail = (id) => {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientApi.fetchClientDetail(id),
    enabled: !!id,
  });
};

export const useDashboardIntelligence = () => {
  return useQuery({
    queryKey: clientKeys.dashboardIntelligence(),
    queryFn: () => clientApi.fetchDashboardIntelligence(),
  });
};

export const useClientIntelligence = (id) => {
  return useQuery({
    queryKey: clientKeys.clientIntelligence(id),
    queryFn: () => clientApi.fetchClientIntelligence(id),
    enabled: !!id,
  });
};

export const useClientActivities = (id, page = 1) => {
  return useQuery({
    queryKey: [...clientKeys.activities(id), { page }],
    queryFn: () => clientApi.fetchClientActivities({ id, page }),
    enabled: !!id,
  });
};

// Mutations
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientApi.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.dashboardIntelligence() });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientApi.updateClient,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.clientIntelligence(data.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.dashboardIntelligence() });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientApi.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.dashboardIntelligence() });
    },
  });
};

export const useScheduleFollowUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientApi.scheduleFollowUp,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.activities(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.dashboardIntelligence() });
    },
  });
};

export const useCreateClientActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clientApi.createClientActivity,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.activities(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.clientIntelligence(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
};
