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
  CLIENTS: "/api/clients/",
  CLIENT_DETAIL: (id) => `/api/clients/${id}/`,
  CLIENT_DASHBOARD_INTELLIGENCE: "/api/clients/intelligence_dashboard/",
  CLIENT_DETAIL_INTELLIGENCE: (id) => `/api/clients/${id}/intelligence/`,
  CLIENT_ACTIVITIES: (id) => `/api/clients/${id}/activities/`,

  // Time Tracking
  TIME_ENTRIES: "/api/time-entries/",
  START_TIMER: "/api/time-entries/start_timer/",
  STOP_TIMER: (id) => `/api/time-entries/${id}/stop_timer/`,
  ACTIVE_TIMER: "/api/time-entries/active_timer/",

  // Project Intelligence
  PROJECT_OVERVIEW: (id) => `/api/projects/${id}/overview/`,
  PROJECT_PROFITABILITY: (id) => `/api/projects/${id}/profitability/`,
  PROJECT_PRODUCTIVITY: (id) => `/api/projects/${id}/productivity/`,
  PROJECT_DELIVERY: (id) => `/api/projects/${id}/delivery/`,
  PROJECT_BUDGET: (id) => `/api/projects/${id}/budget/`,
  PROJECT_HEALTH: (id) => `/api/projects/${id}/health/`,

  // Additional Project APIs
  ACTIVITIES: "/api/activities/",
  ATTACHMENTS: "/api/attachments/",
  RECURRING_TASKS: "/api/recurring-tasks/",

  // Invoices
  INVOICES: "/api/invoices/",
  INVOICE_DETAIL: (id) => `/api/invoices/${id}/`,
  INVOICE_DASHBOARD: "/api/invoices/dashboard_stats/",
  INVOICE_GENERATE_FROM_TIME: (id) => `/api/invoices/${id}/generate_from_time/`,

  // Invoice Items
  INVOICE_ITEMS: "/api/invoice-items/",
  INVOICE_ITEM_DETAIL: (id) => `/api/invoice-items/${id}/`,

  // Intelligence (Fallbacks/Placeholders)
  INVOICE_REVENUE_INTELLIGENCE: "/api/invoices/revenue_intelligence/",
  INVOICE_COLLECTION_INTELLIGENCE: "/api/invoices/collection_intelligence/",
  INVOICE_CLIENT_INTELLIGENCE: "/api/invoices/client_intelligence/",
  INVOICE_CASH_FLOW_INTELLIGENCE: "/api/invoices/cash_flow_intelligence/",
  INVOICE_RISK_INTELLIGENCE: "/api/invoices/risk_intelligence/",

  // Expenses
  EXPENSES: "/api/expenses/",
  EXPENSE_DETAIL: (id) => `/api/expenses/${id}/`,
  EXPENSES_DASHBOARD: "/api/expenses/dashboard_stats/",

  // Expense Categories
  EXPENSE_CATEGORIES: "/api/expense-categories/",
  EXPENSE_CATEGORY_DETAIL: (id) => `/api/expense-categories/${id}/`,

  // Budgets
  BUDGETS: "/api/budgets/",
  BUDGET_DETAIL: (id) => `/api/budgets/${id}/`,
};
