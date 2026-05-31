import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await expensesApi.listBudgets();
      return res.data;
    },
  });

  const createBudget = useMutation({
    mutationFn: (data) => expensesApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: (id) => expensesApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const raw = budgetsQuery.data;
  const budgets = raw?.results ?? (Array.isArray(raw) ? raw : []);
  const overBudgetCount = budgets.filter((b) => b.is_over_budget).length;

  return {
    budgetsQuery,
    budgets,
    overBudgetCount,
    activeBudgetCount: budgets.length,
    isLoading: budgetsQuery.isLoading,
    createBudget,
    deleteBudget,
  };
}
