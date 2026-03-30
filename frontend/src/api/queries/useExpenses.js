import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

export const useExpenses = () => {
    return useQuery({
        queryKey: ["expenses"],
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.EXPENSES);
            return response.data.results || response.data;
        },
    });
};

export const useBudgets = () => {
    return useQuery({
        queryKey: ["budgets"],
        queryFn: async () => {
            const response = await apiClient.get(API_ENDPOINTS.BUDGETS);
            return response.data.results || response.data;
        },
    });
};

export const useExpenseCategories = () => {
    return useQuery({
        queryKey: ["expense-categories"],
        queryFn: async () => {
            // sometimes endpoint might be named expense-categories or expense_categories
            // assuming DRF default hyphenated structure here.
            try {
                const response = await apiClient.get(API_ENDPOINTS.EXPENSE_CATEGORIES);
                return response.data.results || response.data;
            } catch (err) {
                // Fallback to underscore if router used snake_case
                const response = await apiClient.get("/api/expense_categories/");
                return response.data.results || response.data;
            }
        },
    });
};

export const useCreateExpenseCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (categoryData) => {
            const response = await apiClient.post(API_ENDPOINTS.EXPENSE_CATEGORIES, categoryData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
        },
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (expenseData) => {
            const payload = { ...expenseData };
            if (!payload.project) delete payload.project;

            const response = await apiClient.post(API_ENDPOINTS.EXPENSES, payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
        },
    });
};

export const useCreateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (budgetData) => {
            const response = await apiClient.post(API_ENDPOINTS.BUDGETS, budgetData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
        },
    });
};
