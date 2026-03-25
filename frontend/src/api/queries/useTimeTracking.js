import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import toast from "react-hot-toast";

// Start Timer
export const useStartTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, description }) => {
      const response = await apiClient.post(API_ENDPOINTS.START_TIMER, {
        task_id: taskId,
        description,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["activeTimer"], data);
      queryClient.invalidateQueries({ queryKey: ["project"] }); // Refresh task cards
      toast.success("Timer started");
    },
    onError: (error) => {
      toast.error("Failed to start timer");
      console.error(error);
    },
  });
};

// Stop Timer
export const useStopTimer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (timeEntryId) => {
      const response = await apiClient.post(
        API_ENDPOINTS.STOP_TIMER(timeEntryId),
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["activeTimer"], null);
      queryClient.invalidateQueries({ queryKey: ["project"] });
      toast.success("Timer stopped");
    },
    onError: (error) => {
      toast.error("Failed to stop timer");
      console.error(error);
    },
  });
};

// Get Active Timer
export const useActiveTimer = () => {
  return useQuery({
    queryKey: ["activeTimer"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.ACTIVE_TIMER);
        return response.data || null;
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });
};
