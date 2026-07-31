import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";

export const useInvoiceItems = (invoiceId = null) => {
  const queryClient = useQueryClient();

  const invoiceItemsQuery = useQuery({
    queryKey: ["invoiceItems", invoiceId],
    queryFn: async () => {
      const data = await invoicesApi.getInvoiceItems();
      const items = data.results || data || [];
      if (invoiceId) {
        return items.filter(item => item.invoice === parseInt(invoiceId));
      }
      return items;
    },
  });

  const createInvoiceItem = useMutation({
    mutationFn: invoicesApi.createInvoiceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] });
      // Invalidate specific invoice query to refresh total amount
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ["invoice", String(invoiceId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const updateInvoiceItem = useMutation({
    mutationFn: invoicesApi.updateInvoiceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ["invoice", String(invoiceId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const deleteInvoiceItem = useMutation({
    mutationFn: invoicesApi.deleteInvoiceItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoiceItems"] });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: ["invoice", String(invoiceId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    invoiceItemsQuery,
    createInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
  };
};
