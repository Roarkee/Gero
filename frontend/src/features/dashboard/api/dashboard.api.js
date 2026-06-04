import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";

export const getDashboardData = async () => {
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD);
  return response.data;
};
