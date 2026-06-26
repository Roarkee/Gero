export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/users/login/",
  REGISTER: "/api/users/register/",
  REFRESH: "/api/users/refresh/",
  PROFILE: "/api/users/profile/",
  LOGOUT: "/api/users/logout/",
  // Dashboard
  DASHBOARD: "/api/dashboard/",

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
  PROJECT_OVERVIEW: (id) => `/api/intelligence/projects/${id}/overview/`,
  PROJECT_PROFITABILITY: (id) => `/api/intelligence/projects/${id}/profitability/`,
  PROJECT_PRODUCTIVITY: (id) => `/api/intelligence/projects/${id}/productivity/`,
  PROJECT_DELIVERY: (id) => `/api/intelligence/projects/${id}/delivery/`,
  PROJECT_BUDGET: (id) => `/api/intelligence/projects/${id}/budget/`,
  PROJECT_HEALTH: (id) => `/api/intelligence/projects/${id}/health/`,

  // Additional Project APIs
  ACTIVITIES: "/api/activities/",
  ATTACHMENTS: "/api/attachments/",
  RECURRING_TASKS: "/api/recurring-tasks/",

  // Invoices
  INVOICES: "/api/invoices/",
  INVOICE_DETAIL: (id) => `/api/invoices/${id}/`,
  INVOICE_DASHBOARD: "/api/invoices/dashboard_stats/",
  INVOICE_GENERATE_FROM_TIME: (id) => `/api/invoices/${id}/generate_from_time/`,
  INVOICE_DOWNLOAD_PDF: (id) => `/api/invoices/${id}/download_pdf/`,

  // Invoice Items
  INVOICE_ITEMS: "/api/invoice-items/",
  INVOICE_ITEM_DETAIL: (id) => `/api/invoice-items/${id}/`,

  // Intelligence — real routes under /api/intelligence/invoices/
  INVOICE_REVENUE_INTELLIGENCE: "/api/intelligence/invoices/revenue/monthly/",
  INVOICE_REVENUE_TOP_CLIENTS: "/api/intelligence/invoices/revenue/top-clients/",
  INVOICE_REVENUE_CONCENTRATION: "/api/intelligence/invoices/revenue/concentration/",
  INVOICE_COLLECTION_INTELLIGENCE: "/api/intelligence/invoices/collection/performance/",
  INVOICE_COLLECTION_RATE: "/api/intelligence/invoices/collection/rate/",
  INVOICE_CLIENT_INTELLIGENCE: "/api/intelligence/invoices/clients/risk/",
  INVOICE_CLIENT_PAYMENT_BEHAVIOR: "/api/intelligence/invoices/clients/payment-behaviour/",
  INVOICE_CASH_FLOW_INTELLIGENCE: "/api/intelligence/invoices/cashflow/receivables/",
  INVOICE_RISK_INTELLIGENCE: "/api/intelligence/invoices/risk/invoices/",


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

  // Payments
  PAYMENT_PROVIDERS: "/api/payments/providers/",
  PAYMENT_PROVIDER_DETAIL: (id) => `/api/payments/providers/${id}/`,
};
