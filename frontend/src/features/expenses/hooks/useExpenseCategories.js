import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

export function useExpenseCategories() {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const res = await expensesApi.listCategories();
      return res.data;
    },
  });

  const createCategory = useMutation({
    mutationFn: (data) => expensesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "dashboard"] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, ...data }) => expensesApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => expensesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses", "dashboard"] });
    },
  });

  const raw = categoriesQuery.data;
  const categories = raw?.results ?? (Array.isArray(raw) ? raw : []);

  return {
    categoriesQuery,
    categories,
    isLoading: categoriesQuery.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
