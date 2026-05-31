import api from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const expensesApi = {
  // ── Expenses ────────────────────────────────────────────────────────────────
  list: (params = {}) => api.get(API_ENDPOINTS.EXPENSES, { params }),
  get: (id) => api.get(API_ENDPOINTS.EXPENSE_DETAIL(id)),
  create: (data) => api.post(API_ENDPOINTS.EXPENSES, data),
  update: (id, data) => api.patch(API_ENDPOINTS.EXPENSE_DETAIL(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.EXPENSE_DETAIL(id)),
  dashboard: () => api.get(API_ENDPOINTS.EXPENSES_DASHBOARD),

  // ── Categories ───────────────────────────────────────────────────────────────
  listCategories: (params = {}) =>
    api.get(API_ENDPOINTS.EXPENSE_CATEGORIES, { params }),
  getCategory: (id) => api.get(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id)),
  createCategory: (data) => api.post(API_ENDPOINTS.EXPENSE_CATEGORIES, data),
  updateCategory: (id, data) =>
    api.patch(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id), data),
  deleteCategory: (id) =>
    api.delete(API_ENDPOINTS.EXPENSE_CATEGORY_DETAIL(id)),

  // ── Budgets ──────────────────────────────────────────────────────────────────
  listBudgets: (params = {}) => api.get(API_ENDPOINTS.BUDGETS, { params }),
  getBudget: (id) => api.get(API_ENDPOINTS.BUDGET_DETAIL(id)),
  createBudget: (data) => api.post(API_ENDPOINTS.BUDGETS, data),
  updateBudget: (id, data) => api.patch(API_ENDPOINTS.BUDGET_DETAIL(id), data),
  deleteBudget: (id) => api.delete(API_ENDPOINTS.BUDGET_DETAIL(id)),
};
