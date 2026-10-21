import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";

export const useInvoices = (params = {}) => {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ["invoices", params],
    queryFn: () => invoicesApi.getInvoices(params),
  });

  const createInvoice = useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: invoicesApi.updateInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // id from URL params is a string; data.id is an integer — coerce to match
      queryClient.invalidateQueries({ queryKey: ["invoice", String(data.id)] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    invoicesQuery,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
};

export const useInvoice = (id) => {
  const queryClient = useQueryClient();

  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
  });

  const generateFromTime = useMutation({
    mutationFn: () => invoicesApi.generateFromTime(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const sendInvoice = useMutation({
    mutationFn: () => invoicesApi.sendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const cancelInvoice = useMutation({
    mutationFn: () => invoicesApi.cancelInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const duplicateInvoice = useMutation({
    mutationFn: () => invoicesApi.duplicateInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const markViewed = useMutation({
    mutationFn: () => invoicesApi.markViewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const resendInvoice = useMutation({
    mutationFn: () => invoicesApi.resendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(id)] });
    },
  });

  return {
    invoiceQuery,
    generateFromTime,
    sendInvoice,
    cancelInvoice,
    duplicateInvoice,
    markViewed,
    resendInvoice,
  };
};

export const useInvoiceDashboard = () => {
  const dashboardQuery = useQuery({
    queryKey: ["invoiceDashboard"],
    queryFn: invoicesApi.getDashboardStats,
  });

  return {
    dashboardQuery,
  };
};

export const useInvoicePayment = () => {
  const queryClient = useQueryClient();

  const createPayment = useMutation({
    mutationFn: invoicesApi.createInvoicePayment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", String(variables.invoice)] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    createPayment,
  };
};
