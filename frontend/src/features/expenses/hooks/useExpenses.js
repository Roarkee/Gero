import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useExpenses(params = {}) {
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", "list", params],
    queryFn: async () => {
      const res = await expensesApi.list(params);
      return res.data;
    },
  });

  const createExpense = useMutation({
    mutationFn: (data) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const raw = expensesQuery.data;
  const expenses = raw?.results ?? (Array.isArray(raw) ? raw : []);

  return {
    expensesQuery,
    expenses,
    count: raw?.count ?? expenses.length,
    isLoading: expensesQuery.isLoading,
    createExpense,
    deleteExpense,
  };
}
