import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
      return response.data || [];
    },
    // Poll every 15 seconds
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      return response.data || { unread_notifications: 0 };
    },
    // Poll every 15 seconds
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATION_READ(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notificationsQuery,
    unreadCountQuery,
    markReadMutation,
    markAllReadMutation,
  };
};
