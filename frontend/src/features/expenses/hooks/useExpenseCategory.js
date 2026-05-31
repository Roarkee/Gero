import { useQuery } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useExpenseCategory(id) {
  const categoryQuery = useQuery({
    queryKey: ["expense-categories", id],
    queryFn: async () => {
      const res = await expensesApi.getCategory(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch all expenses scoped to this category for the detail view
  const expensesQuery = useQuery({
    queryKey: ["expenses", "list", { category: id }],
    queryFn: async () => {
      const res = await expensesApi.list({ category: id });
      return res.data;
    },
    enabled: !!id,
  });

  const raw = expensesQuery.data;
  const expenses = raw?.results ?? (Array.isArray(raw) ? raw : []);

  return {
    categoryQuery,
    category: categoryQuery.data,
    expensesQuery,
    expenses,
    isLoading: categoryQuery.isLoading,
  };
}
