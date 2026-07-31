import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Get expenses
export const useExpenses = (projectId = null) => {
  return useQuery({
    queryKey: ["expenses", projectId],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.EXPENSES);
      const data = response.data.results || response.data;
      if (projectId) {
        return data.filter(e => e.project === projectId);
      }
      return data;
    },
  });
};

// Create expense
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData) => {
      const response = await apiClient.post(API_ENDPOINTS.EXPENSES, expenseData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["project-profitability"] });
      queryClient.invalidateQueries({ queryKey: ["project-budget"] });
    },
  });
};

// Delete expense
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(API_ENDPOINTS.EXPENSE_DETAIL(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["project-profitability"] });
      queryClient.invalidateQueries({ queryKey: ["project-budget"] });
    },
  });
};

// Get categories
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.EXPENSE_CATEGORIES);
      return response.data.results || response.data;
    },
  });
};
