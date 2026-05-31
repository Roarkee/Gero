import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useBudget(id) {
  const queryClient = useQueryClient();

  const budgetQuery = useQuery({
    queryKey: ["budgets", id],
    queryFn: async () => {
      const res = await expensesApi.getBudget(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch expenses that fall within the budget period and category
  const budget = budgetQuery.data;
  const expensesQuery = useQuery({
    queryKey: ["expenses", "list", { category: budget?.category, budgetId: id }],
    queryFn: async () => {
      const res = await expensesApi.list({
        category: budget.category,
        date_after: budget.start_date,
        date_before: budget.end_date,
      });
      return res.data;
    },
    enabled: !!budget,
  });

  const updateBudget = useMutation({
    mutationFn: (data) => expensesApi.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: () => expensesApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const raw = expensesQuery.data;
  const expenses = raw?.results ?? (Array.isArray(raw) ? raw : []);

  return {
    budgetQuery,
    budget,
    expensesQuery,
    expenses,
    isLoading: budgetQuery.isLoading,
    updateBudget,
    deleteBudget,
  };
}
