import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useExpense(id) {
  const queryClient = useQueryClient();

  const expenseQuery = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await expensesApi.get(id);
      return res.data;
    },
    enabled: !!id,
  });

  const updateExpense = useMutation({
    mutationFn: (data) => expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: () => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return {
    expenseQuery,
    expense: expenseQuery.data,
    isLoading: expenseQuery.isLoading,
    updateExpense,
    deleteExpense,
  };
}
