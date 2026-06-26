import api from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const paymentsApi = {
  getProviders: async () => {
    const response = await api.get(API_ENDPOINTS.PAYMENT_PROVIDERS);
    console.log(response.data)
    return response.data.results;
  },
  createProvider: async (data) => {
    const response = await api.post(API_ENDPOINTS.PAYMENT_PROVIDERS, data);
    return response.data;
  },
  updateProvider: async ({ id, ...data }) => {
    const response = await api.patch(API_ENDPOINTS.PAYMENT_PROVIDER_DETAIL(id), data);
    return response.data;
  },
  deleteProvider: async (id) => {
    await api.delete(API_ENDPOINTS.PAYMENT_PROVIDER_DETAIL(id));
    return id;
  },
};
