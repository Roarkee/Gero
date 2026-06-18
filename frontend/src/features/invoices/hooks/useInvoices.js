import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";

export const useInvoices = () => {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: invoicesApi.getInvoices,
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
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] });
    },
  });

  return {
    invoiceQuery,
    generateFromTime,
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
