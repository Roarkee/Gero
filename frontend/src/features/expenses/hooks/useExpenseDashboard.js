import { useQuery } from "@tanstack/react-query";
import { expensesApi } from "../api/expenses.api";

/**
 * Fetches /api/expenses/dashboard_stats/
 * Returns: { monthly_expenses, category_expenses, monthly_trend }
 *
 * Also derives:
 *   - totalCategories  (from category_expenses length)
 *   - overBudgetCount  (injected by useBudgets when composed on page)
 */
export function useExpenseDashboard() {
  const query = useQuery({
    queryKey: ["expenses", "dashboard"],
    queryFn: async () => {
      const res = await expensesApi.dashboard();
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const data = query.data;

  return {
    dashboardQuery: query,
    isLoading: query.isLoading,
    monthlyExpenses: data?.monthly_expenses ?? null,
    categoryExpenses: data?.category_expenses ?? [],
    monthlyTrend: data?.monthly_trend ?? [],
    totalCategories: data?.category_expenses?.length ?? 0,
  };
}
