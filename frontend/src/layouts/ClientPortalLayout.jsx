import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, LogOut, Menu, X, PlusCircle, Briefcase } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { clsx } from "clsx";

export default function ClientPortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isHome = location.pathname === "/portal" || location.pathname === "/portal/";
  const isRequest = location.pathname === "/portal/request" || location.pathname === "/portal/request/";

  return (
    <div className="h-screen flex bg-[#ECF0F1] dark:bg-[#0B0F19] font-sans overflow-hidden">
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-900 border-r border-[#ECF0F1] dark:border-gray-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center px-5 border-b border-[#ECF0F1] dark:border-gray-800 gap-3 shrink-0">
          <div className="h-7 w-7 bg-[#2C3E50] rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            G
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#2C3E50] dark:text-white">Gero</p>
            <p className="text-xs text-[#7F8C8D] dark:text-gray-500">Client Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/portal/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === "/portal/dashboard"
                ? "bg-[#3498DB]/10 text-[#3498DB]"
                : "text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <Home className="w-4 h-4 shrink-0" />
            Dashboard
          </Link>
          <Link
            to="/portal/projects"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.startsWith("/portal/projects")
                ? "bg-[#3498DB]/10 text-[#3498DB]"
                : "text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            My Projects
          </Link>
          <Link
            to="/portal/invoices"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname.startsWith("/portal/invoices")
                ? "bg-[#3498DB]/10 text-[#3498DB]"
                : "text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 10h8"/><path d="M8 14h8"/><path d="M8 18h8"/><path d="M8 6h.01"/></svg>
            Invoices
          </Link>
          <Link
            to="/portal/request"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isRequest
                ? "bg-[#3498DB]/10 text-[#3498DB]"
                : "text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            New Request
          </Link>

          {user?.is_freelancer && (
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg text-xs font-semibold text-[#3498DB] bg-[#3498DB]/10 hover:bg-[#3498DB]/20 transition-colors"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              Freelancer Workspace &rarr;
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[#ECF0F1] dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB] font-semibold text-xs shrink-0 ring-2 ring-white">
              {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-[#2C3E50] dark:text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
              </p>
              <p className="text-xs text-[#7F8C8D] dark:text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-[#ECF0F1] dark:border-gray-800 flex items-center px-4 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#7F8C8D] hover:text-[#2C3E50] dark:hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-bold text-[#2C3E50] dark:text-white">Gero Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#ECF0F1]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
