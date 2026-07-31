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
    <div className="h-screen flex bg-[#F8F9FC] dark:bg-[#0B0F19] font-sans overflow-hidden">
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center px-5 border-b border-gray-100 dark:border-gray-800 gap-3 shrink-0">
          <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base">
            G
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Gero</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Client Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/portal"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isHome
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <Home className="w-4 h-4 shrink-0" />
            My Projects
          </Link>
          <Link
            to="/portal/request"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isRequest
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            New Request
          </Link>

          {user?.role === "freelancer" && (
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 mt-4 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              Freelancer Workspace &rarr;
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs shrink-0">
              {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-bold text-gray-900 dark:text-white">Gero Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
