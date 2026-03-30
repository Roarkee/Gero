import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Fetch all clients
export const useClients = () => {
  return useQuery({
    queryKey: ["client"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CLIENTS);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
  });
};

// Create client (optional, if we want to allow creating clients inline)
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData) => {
      const response = await apiClient.post(API_ENDPOINTS.CLIENTS, clientData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });
};
