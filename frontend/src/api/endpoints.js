export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/users/login/",
  REGISTER: "/api/users/register/",
  REFRESH: "/api/users/refresh/",
  PROFILE: "/api/users/profile/",
  LOGOUT: "/api/users/logout/",

  // Projects
  PROJECTS: "/api/projects/",
  PROJECT_DETAIL: (id) => `/api/projects/${id}/`,

  // Task Lists
  TASK_LISTS: "/api/tasklists/",
  TASK_LIST_DETAIL: (id) => `/api/tasklists/${id}/`,

  // Tasks
  TASKS: "/api/tasks/",
  TASK_DETAIL: (id) => `/api/tasks/${id}/`,

  // Subtasks
  SUBTASKS: "/api/subtasks/",
  SUBTASK_DETAIL: (id) => `/api/subtasks/${id}/`,

  // Labels
  LABELS: "/api/labels/",
  LABEL_DETAIL: (id) => `/api/labels/${id}/`,

  // Clients
  CLIENTS: "/api/client/",
  CLIENT_DETAIL: (id) => `/api/client/${id}/`,

  // Time Tracking
  TIME_ENTRIES: "/api/time-entries/",
  START_TIMER: "/api/time-entries/start_timer/",
  STOP_TIMER: (id) => `/api/time-entries/${id}/stop_timer/`,
  ACTIVE_TIMER: "/api/time-entries/active_timer/",

  // Invoices
  INVOICES: "/api/invoices/",
  INVOICE_DETAIL: (id) => `/api/invoices/${id}/`,
  GENERATE_INVOICE: (id) => `/api/invoices/${id}/generate_from_time/`,

  // Expenses
  EXPENSES: "/api/expenses/",
  EXPENSE_DETAIL: (id) => `/api/expenses/${id}/`,
  BUDGETS: "/api/budgets/",
  EXPENSE_CATEGORIES: "/api/expense-categories/",
};
