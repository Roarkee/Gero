import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Get labels
export const useLabels = () => {
  return useQuery({
    queryKey: ["labels"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.LABELS);
      return response.data.results || response.data;
    },
  });
};

// Create label
export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (labelData) => {
      const response = await apiClient.post(API_ENDPOINTS.LABELS, labelData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["project"] }); // Tasks might update with new label
    },
  });
};

// Update label
export const useUpdateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch(
        API_ENDPOINTS.LABEL_DETAIL(id),
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

// Delete label
export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(API_ENDPOINTS.LABEL_DETAIL(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
