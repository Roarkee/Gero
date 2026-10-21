import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNotificationWebSocket } from "../api/queries/useNotificationWebSocket";

import { clsx } from "clsx";
import NotificationDropdown from "../components/shared/NotificationDropdown";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Workflow", href: "/dashboard/ai-history", icon: Sparkles },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Connect to real-time notification WebSocket
  useNotificationWebSocket();

  return (
    <div className="h-screen bg-[#ECF0F1] dark:bg-[#0B0F19] overflow-hidden flex font-sans">
      {/* Mobile sidebar */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 transition duration-300 ease-in-out data-[closed]:-translate-x-full">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <div className="h-8 w-8 bg-[#2C3E50] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  G
                </div>
                <span className="ml-3 text-xl font-bold text-[#2C3E50] dark:text-white">
                  Gero
                </span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={clsx(
                              location.pathname === item.href
                                ? "bg-gray-50 text-[#3498DB] dark:bg-gray-800 dark:text-[#3498DB]"
                                : "text-[#7F8C8D] hover:text-[#3498DB] hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                              "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200",
                            )}
                          >
                            <item.icon
                              className={clsx(
                                location.pathname === item.href
                                  ? "text-[#3498DB] dark:text-[#3498DB]"
                                  : "text-[#7F8C8D] group-hover:text-[#3498DB] dark:text-gray-500 dark:group-hover:text-white",
                                "h-6 w-6 shrink-0 transition-colors",
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div 
        className={clsx(
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
          isDesktopCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <div className="flex grow flex-col overflow-y-auto border-r border-[#ECF0F1] dark:border-gray-800 bg-white dark:bg-gray-900 pb-4 relative">
          
          <div className="flex h-16 shrink-0 items-center gap-3 px-6 mt-2">
            <div className="h-8 w-8 min-w-[32px] bg-[#2C3E50] rounded-lg flex items-center justify-center text-white font-bold shadow-sm dark:shadow-none">
              G
            </div>
            {!isDesktopCollapsed && (
              <span className="text-xl font-bold tracking-tight text-[#2C3E50] dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300">
                Gero
              </span>
            )}
          </div>
          
          <nav className="flex flex-1 flex-col mt-5 px-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                {!isDesktopCollapsed && (
                  <div className="text-xs font-semibold leading-6 text-[#7F8C8D] uppercase tracking-wider mb-2 px-2">
                    Platform
                  </div>
                )}
                <ul role="list" className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        title={isDesktopCollapsed ? item.name : undefined}
                        className={clsx(
                          location.pathname === item.href
                            ? "bg-[#3498DB]/10 text-[#3498DB] dark:bg-[#3498DB]/20 dark:text-[#3498DB]"
                            : "text-[#7F8C8D] hover:bg-[#ECF0F1] hover:text-[#3498DB] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                          "group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ease-in-out items-center",
                          isDesktopCollapsed ? "justify-center" : ""
                        )}
                      >
                        <item.icon
                          className={clsx(
                            location.pathname === item.href
                              ? "text-[#3498DB] dark:text-[#3498DB]"
                              : "text-[#7F8C8D] group-hover:text-[#3498DB] dark:text-gray-500 dark:group-hover:text-white",
                            "h-5 w-5 shrink-0 transition-colors",
                          )}
                          aria-hidden="true"
                        />
                        {!isDesktopCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>


              <li className="mt-auto pt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {(user?.is_client || user?.has_client_portal) && (
                    <Link
                      to="/portal"
                      title={isDesktopCollapsed ? "Client Portal" : undefined}
                      className={clsx(
                        "flex items-center rounded-xl text-xs font-semibold text-[#3498DB] dark:text-[#3498DB] bg-[#3498DB]/10 dark:bg-[#3498DB]/20 hover:bg-[#3498DB]/20 transition-colors",
                        isDesktopCollapsed ? "justify-center p-2.5" : "gap-x-2.5 px-3 py-2.5"
                      )}
                    >
                      <Briefcase className="h-4 w-4 shrink-0" />
                      {!isDesktopCollapsed && <span>Client Portal &rarr;</span>}
                    </Link>
                  )}

                  <div
                    className={clsx(
                      "flex items-center rounded-xl cursor-pointer hover:bg-[#ECF0F1] dark:hover:bg-gray-800 transition-colors",
                      isDesktopCollapsed ? "justify-center p-2" : "gap-x-4 px-2 py-3 bg-gray-50 dark:bg-gray-800/50"
                    )}
                    onClick={() => logout()}
                    title={isDesktopCollapsed ? "Logout" : undefined}
                  >
                  <div className="h-8 w-8 min-w-[32px] rounded-full bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB] font-bold text-xs ring-2 ring-white dark:ring-gray-700">
                    {user?.email?.[0].toUpperCase() || "U"}
                  </div>
                  {!isDesktopCollapsed && (
                    <>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-[#2C3E50] dark:text-white truncate">
                          {user?.first_name || "User"}
                        </span>
                        <span className="text-xs text-[#7F8C8D] dark:text-gray-400 truncate max-w-[120px]">
                          {user?.email}
                        </span>
                      </div>
                      <LogOut className="ml-auto h-4 w-4 text-[#7F8C8D] flex-shrink-0" aria-hidden="true" />
                    </>
                  )}
                </div>
              </div>
            </li>
            </ul>
          </nav>
          
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-[#ECF0F1] dark:border-gray-700 rounded-full p-1 text-[#7F8C8D] hover:text-[#3498DB] shadow-sm z-10 transition-colors hidden lg:block"
          >
            {isDesktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-1 min-w-0 flex-col transition-all duration-300 ease-in-out",
          isDesktopCollapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-40 lg:hidden flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-[#ECF0F1] dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-[#7F8C8D] dark:text-gray-300"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-4">
            <NotificationDropdown align="right" />
            <div className="h-8 w-8 bg-[#2C3E50] rounded-lg flex items-center justify-center text-white font-bold">
              G
            </div>
          </div>
        </div>

        {/* Top header for desktop */}
        <div className="hidden lg:flex h-16 shrink-0 items-center justify-between border-b border-[#ECF0F1] dark:border-gray-800 bg-white dark:bg-gray-900 px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#7F8C8D] dark:text-gray-300">
              Welcome back, {user?.first_name || user?.email?.split('@')[0] || "User"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown align="right" />
          </div>
        </div>

        <main className="flex-1 overflow-hidden bg-[#ECF0F1] dark:bg-[#0B0F19]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
