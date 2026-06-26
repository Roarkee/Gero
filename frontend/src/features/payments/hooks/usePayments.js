import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import toast from "react-hot-toast";

export const PROVIDERS_QUERY_KEY = ["paymentProviders"];

export const usePaymentProviders = () => {
  return useQuery({
    queryKey: PROVIDERS_QUERY_KEY,
    queryFn: paymentsApi.getProviders,
  });
};

export const useCreateProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success("Payment method added!");
    },
    onError: (err) => {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to add payment method.";
      toast.error(msg);
    },
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.updateProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success("Payment method updated!");
    },
    onError: (err) => {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to update payment method.";
      toast.error(msg);
    },
  });
};

export const useDeleteProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY });
      toast.success("Payment method removed.");
    },
  });
};
