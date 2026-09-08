import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const fetchClients = async (params = {}) => {
  const response = await apiClient.get(API_ENDPOINTS.CLIENTS, { params });
  return response.data.results || response.data || [];
};

export const fetchClientDetail = async (id) => {
  const response = await apiClient.get(API_ENDPOINTS.CLIENT_DETAIL(id));
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await apiClient.post(API_ENDPOINTS.CLIENTS, clientData);
  return response.data;
};

export const updateClient = async ({ id, ...clientData }) => {
  const response = await apiClient.patch(API_ENDPOINTS.CLIENT_DETAIL(id), clientData);
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await apiClient.delete(API_ENDPOINTS.CLIENT_DETAIL(id));
  return response.data;
};

export const fetchDashboardIntelligence = async () => {
  const response = await apiClient.get(API_ENDPOINTS.CLIENT_DASHBOARD_INTELLIGENCE);
  return response.data;
};

export const fetchClientIntelligence = async (id) => {
  const response = await apiClient.get(API_ENDPOINTS.CLIENT_DETAIL_INTELLIGENCE(id));
  return response.data;
};

export const fetchClientActivities = async ({ id, page = 1 }) => {
  const response = await apiClient.get(API_ENDPOINTS.CLIENT_ACTIVITIES(id), {
    params: { page },
  });
  return response.data.results || response.data || [];
};

export const createClientActivity = async ({ id, ...data }) => {
  const response = await apiClient.post(API_ENDPOINTS.CLIENT_ACTIVITIES(id), data);
  return response.data;
};

export const scheduleFollowUp = async ({ id, ...data }) => {
  const response = await apiClient.post(`${API_ENDPOINTS.CLIENT_DETAIL(id)}schedule_followup/`, data);
  return response.data;
};

export const inviteClient = async (id) => {
  const response = await apiClient.post(API_ENDPOINTS.CLIENT_INVITE(id));
  return response.data;
};

export const dismissAttention = async (id) => {
  const response = await apiClient.post(API_ENDPOINTS.CLIENT_DISMISS_ATTENTION(id));
  return response.data;
};
