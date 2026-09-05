import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import PortalRoute from "./components/shared/PortalRoute";

// Pages
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import LandingPage from "./features/landing/LandingPage";
import Dashboard from "./features/dashboard/pages/Dashboard";
import ProjectsDashboard from "./features/projects/pages/ProjectsDashboard";
import ProjectWorkspace from "./features/projects/pages/ProjectWorkspace";
import DashboardLayout from "./layouts/DashboardLayout";
import ClientPortalLayout from "./layouts/ClientPortalLayout";
import AIWorkflow from "./features/dashboard/pages/AIWorkflow";
import AIHistory from "./features/dashboard/pages/AIHistory";
import ClientsLayout from "./features/clients/ClientsLayout";
import ClientsDashboard from "./features/clients/pages/ClientsDashboard";
import ClientsList from "./features/clients/pages/ClientsList";
import PipelineBoard from "./features/clients/pages/PipelineBoard";
import ClientDetail from "./features/clients/pages/ClientDetail";
import AttentionCenter from "./features/clients/pages/AttentionCenter";
import FollowUpQueue from "./features/clients/pages/FollowUpQueue";
import InvoicesLayout from "./features/invoices/InvoicesLayout";
import InvoicesDashboard from "./features/invoices/pages/InvoicesDashboard";
import InvoicesList from "./features/invoices/pages/InvoicesList";
import RevenueAnalytics from "./features/invoices/pages/RevenueAnalytics";
import CollectionAnalytics from "./features/invoices/pages/CollectionAnalytics";
import ClientRiskDashboard from "./features/invoices/pages/ClientRiskDashboard";
import CashFlowDashboard from "./features/invoices/pages/CashFlowDashboard";
import InvoiceDetails from "./features/invoices/pages/InvoiceDetails";
import ExpensesLayout from "./features/expenses/ExpensesLayout";
import ExpensesDashboard from "./features/expenses/pages/ExpensesDashboard";
import ExpensesList from "./features/expenses/pages/ExpensesList";
import ExpenseDetail from "./features/expenses/pages/ExpenseDetail";
import ExpenseForm from "./features/expenses/pages/ExpenseForm";
import CategoriesPage from "./features/expenses/pages/CategoriesPage";
import CategoryDetail from "./features/expenses/pages/CategoryDetail";
import BudgetsDashboard from "./features/expenses/pages/BudgetsDashboard";
import BudgetDetail from "./features/expenses/pages/BudgetDetail";
import BudgetForm from "./features/expenses/pages/BudgetForm";
import SettingsLayout from "./features/settings/SettingsLayout";
import PaymentSettings from "./features/payments/pages/PaymentSettings";
import NotificationsPage from "./features/notifications/pages/NotificationsPage";
import PortalHome from "./features/clientPortal/pages/PortalHome";
import PortalDashboard from "./features/clientPortal/pages/PortalDashboard";
import PortalInvoices from "./features/clientPortal/pages/PortalInvoices";
import PortalProject from "./features/clientPortal/pages/PortalProject";
import AcceptInvite from "./features/clientPortal/pages/AcceptInvite";
import NewRequest from "./features/clientPortal/pages/NewRequest";
import PublicInvoice from "./features/clientPortal/pages/PublicInvoice";
import PaymentStatus from "./features/payments/pages/PaymentStatus";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { checkAuth } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal/accept-invite" element={<AcceptInvite />} />
          <Route path="/invoice/:id" element={<PublicInvoice />} />
          <Route path="/payment/status" element={<PaymentStatus />} />
 
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/ai-history" element={<AIHistory />} />
            <Route path="/dashboard/ai-workflow" element={<Navigate to="/dashboard/ai-history" replace />} />
            <Route path="/dashboard/ai-workflow/new" element={<AIWorkflow />} />
            <Route path="/dashboard/ai-workflow/:id" element={<AIWorkflow />} />
            <Route path="/projects" element={<ProjectsDashboard />} />
            <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
            <Route path="/clients" element={<ClientsLayout />}>
              <Route index element={<ClientsDashboard />} />
              <Route path="list" element={<ClientsList />} />
              <Route path="board" element={<PipelineBoard />} />
              <Route path="attention" element={<AttentionCenter />} />
              <Route path="follow-ups" element={<FollowUpQueue />} />
              <Route path=":id" element={<ClientDetail />} />
            </Route>
            <Route path="/invoices" element={<InvoicesLayout />}>
              <Route index element={<InvoicesDashboard />} />
              <Route path="list" element={<InvoicesList />} />
              <Route path="revenue" element={<RevenueAnalytics />} />
              <Route path="collections" element={<CollectionAnalytics />} />
              <Route path="client-risk" element={<ClientRiskDashboard />} />
              <Route path="cash-flow" element={<CashFlowDashboard />} />
              <Route path=":id" element={<InvoiceDetails />} />
            </Route>
            <Route path="/expenses" element={<ExpensesLayout />}>
              <Route index element={<ExpensesDashboard />} />
              <Route path="list" element={<ExpensesList />} />
              <Route path="new" element={<ExpenseForm />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="categories/:id" element={<CategoryDetail />} />
              <Route path="budgets" element={<BudgetsDashboard />} />
              <Route path="budgets/new" element={<BudgetForm />} />
              <Route path="budgets/:id" element={<BudgetDetail />} />
              <Route path=":expenseId" element={<ExpenseDetail />} />
              <Route path=":expenseId/edit" element={<ExpenseForm />} />
            </Route>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="/settings/payments" replace />} />
              <Route path="payments" element={<PaymentSettings />} />
              <Route path="notifications" element={<div className="p-8 text-gray-500">Notification preferences coming soon.</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />

          {/* Client Portal */}
          <Route
            path="/portal"
            element={
              <PortalRoute>
                <ClientPortalLayout />
              </PortalRoute>
            }
          >
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="projects" element={<PortalHome />} />
            <Route path="projects/:id" element={<PortalProject />} />
            <Route path="invoices" element={<PortalInvoices />} />
            <Route path="request" element={<NewRequest />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
