import api from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const invoicesApi = {
  // Invoices
  getInvoices: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.INVOICES, { params });
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
  sendInvoice: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_SEND(id));
    return response.data;
  },
  cancelInvoice: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_CANCEL(id));
    return response.data;
  },
  duplicateInvoice: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_DUPLICATE(id));
    return response.data;
  },
  markViewed: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_MARK_VIEWED(id));
    return response.data;
  },

  resendInvoice: async (id) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_RESEND(id));
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

  // Payments
  createInvoicePayment: async (data) => {
    const response = await api.post(API_ENDPOINTS.INVOICE_PAYMENTS, data);
    return response.data;
  },

  // Intelligence — wired to real backend routes
  getRevenueIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_REVENUE_INTELLIGENCE);
    return response.data ?? null;
  },
  getRevenueTopClients: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_REVENUE_TOP_CLIENTS);
    return response.data ?? null;
  },
  getCollectionIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_COLLECTION_INTELLIGENCE);
    return response.data ?? null;
  },
  getCollectionRate: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_COLLECTION_RATE);
    return response.data ?? null;
  },
  getClientIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CLIENT_INTELLIGENCE);
    return response.data ?? null;
  },
  getClientPaymentBehavior: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CLIENT_PAYMENT_BEHAVIOR);
    return response.data ?? null;
  },
  getCashFlowIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_CASH_FLOW_INTELLIGENCE);
    return response.data ?? null;
  },
  getRiskIntelligence: async () => {
    const response = await api.get(API_ENDPOINTS.INVOICE_RISK_INTELLIGENCE);
    return response.data ?? null;
  },
};
