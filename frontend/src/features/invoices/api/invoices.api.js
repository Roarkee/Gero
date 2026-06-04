import api from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const invoicesApi = {
  // Invoices
  getInvoices: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICES);
    return response.data;
  },
  getInvoice: async (id) => {
    const response = await api.get(API_ENDPOINTS.INVOICE_DETAIL(id));
    return response.data;
  },
  createInvoice: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVOICES, data);
    return response.data;
  },
  updateInvoice: async ({ id, ...data }) => {
    const response = await api.patch(API_ENDPOINTS.INVOICE_DETAIL(id), data);
    return response.data;
  },
  deleteInvoice: async (id) => {
    const response = await api.delete(API_ENDPOINTS.INVOICE_DETAIL(id));
    return response.data;
  },
  downloadPDF: async (id) => {
    const response = await api.get(API_ENDPOINTS.INVOICE_DOWNLOAD_PDF(id), {
      responseType: 'blob'
    });
    return response.data;
  },

  // Actions
  generateFromTime: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_GENERATE_FROM_TIME(id));
    return response.data;
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_DASHBOARD);
    return response.data;
  },

  // Invoice Items
  getInvoiceItems: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_ITEMS);
    return response.data;
  },
  createInvoiceItem: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_ITEMS, data);
    return response.data;
  },
  updateInvoiceItem: async ({ id, ...data }) => {
    const response = await api.patch(API_ENDPOINTS.INVOICE_ITEM_DETAIL(id), data);
    return response.data;
  },
  deleteInvoiceItem: async (id) => {
    const response = await api.delete(API_ENDPOINTS.INVOICE_ITEM_DETAIL(id));
    return response.data;
  },

  // Intelligence — wired to real backend routes
  getRevenueIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_REVENUE_INTELLIGENCE);
    return response.data;
  },
  getRevenueTopClients: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_REVENUE_TOP_CLIENTS);
    return response.data;
  },
  getCollectionIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_COLLECTION_INTELLIGENCE);
    return response.data;
  },
  getCollectionRate: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_COLLECTION_RATE);
    return response.data;
  },
  getClientIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CLIENT_INTELLIGENCE);
    return response.data;
  },
  getClientPaymentBehavior: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CLIENT_PAYMENT_BEHAVIOR);
    return response.data;
  },
  getCashFlowIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CASH_FLOW_INTELLIGENCE);
    return response.data;
  },
  getRiskIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_RISK_INTELLIGENCE);
    return response.data;
  },
};

