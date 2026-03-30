import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const useInvoices = () => {
    return useQuery({
        queryKey: ["invoices"],
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.INVOICES);
            return response.data.results || response.data;
        },
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (invoiceData) => {
            const payload = { ...invoiceData };
            if (!payload.project) delete payload.project;

            const response = await apiClient.post(API_ENDPOINTS.INVOICES, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });
};

export const useGenerateInvoiceFromTime = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.post(API_ENDPOINTS.GENERATE_INVOICE(id));
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });
};
