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
  Zap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { clsx } from "clsx";
import NotificationDropdown from "../components/shared/NotificationDropdown";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Workflow", href: "/dashboard/ai-history", icon: Sparkles },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen bg-gray-900 bg-mesh-dark bg-fixed overflow-hidden flex font-sans text-gray-50">
      {/* Mobile sidebar */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md" aria-hidden="true" />
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
            <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-none rounded-r-2xl px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center text-gray-950 font-bold text-xl shadow-neon">
                  G
                </div>
                <span className="ml-3 text-xl font-heading font-bold text-white text-neon-cyan">
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
                                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                : "text-gray-400 hover:text-primary-400 hover:bg-primary-500/10",
                              "group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium transition-all duration-300",
                            )}
                          >
                            <item.icon
                              className={clsx(
                                location.pathname === item.href
                                  ? "text-primary-400"
                                  : "text-gray-500 group-hover:text-primary-400",
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
          "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out backdrop-blur-xl bg-gray-900/40 border-r border-white/10",
          isDesktopCollapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <div className="flex grow flex-col overflow-y-auto pb-4 relative custom-scrollbar">
          
          <div className="flex h-16 shrink-0 items-center gap-3 px-6 mt-2">
            <div className="h-8 w-8 min-w-[32px] bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold shadow-neon-purple transition-all duration-300 hover:scale-105">
              G
            </div>
            {!isDesktopCollapsed && (
              <span className="text-xl font-heading font-bold tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-300 text-neon-cyan">
                Gero
              </span>
            )}
          </div>
          
          <nav className="flex flex-1 flex-col mt-5 px-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                {!isDesktopCollapsed && (
                  <div className="text-[10px] font-semibold leading-6 text-gray-500 uppercase tracking-widest mb-2 px-2">
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
                            ? "bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent",
                          "group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all duration-300 ease-in-out items-center relative overflow-hidden",
                          isDesktopCollapsed ? "justify-center" : ""
                        )}
                      >
                        {/* Glow effect on active */}
                        {location.pathname === item.href && (
                           <div className="absolute inset-0 bg-primary-500/10 blur-xl opacity-50" />
                        )}
                        <item.icon
                          className={clsx(
                            location.pathname === item.href
                              ? "text-primary-400"
                              : "text-gray-500 group-hover:text-primary-400",
                            "h-5 w-5 shrink-0 transition-colors relative z-10",
                          )}
                          aria-hidden="true"
                        />
                        {!isDesktopCollapsed && <span className="whitespace-nowrap relative z-10">{item.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>


              <li className="mt-auto pt-4 flex flex-col gap-4">
                {/* Pro Banner */}
                {!isDesktopCollapsed ? (
                  <div className="relative rounded-2xl bg-gradient-to-tr from-secondary-700 to-primary-700 p-4 text-white shadow-neon-purple overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-500 blur-3xl opacity-30 rounded-full"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Zap className="h-4 w-4 fill-primary-300 text-primary-300 animate-pulse-glow" />
                      <span className="font-heading font-semibold text-sm tracking-wide">Pro Plan</span>
                    </div>
                    <p className="text-xs text-primary-100/70 mb-3 relative z-10">
                      Get unlimited projects and AI features.
                    </p>
                    <button className="btn-neon w-full rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-xs py-2 transition-colors relative z-10">
                      Upgrade Now
                    </button>
                  </div>
                ) : (
                  <div title="Upgrade to Pro" className="mx-auto rounded-xl bg-gradient-to-tr from-secondary-600 to-primary-600 p-3 text-white shadow-neon-purple cursor-pointer transition-transform hover:scale-110">
                    <Zap className="h-4 w-4 fill-white" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {user?.has_client_portal && (
                    <Link
                      to="/portal"
                      title={isDesktopCollapsed ? "Client Portal" : undefined}
                      className={clsx(
                        "flex items-center rounded-xl text-xs font-semibold text-secondary-300 bg-secondary-900/30 border border-secondary-500/20 hover:bg-secondary-900/50 hover:border-secondary-500/50 transition-all shadow-[0_0_10px_rgba(123,47,255,0.1)]",
                        isDesktopCollapsed ? "justify-center p-2.5" : "gap-x-2.5 px-3 py-2.5"
                      )}
                    >
                      <Briefcase className="h-4 w-4 shrink-0" />
                      {!isDesktopCollapsed && <span>Client Portal &rarr;</span>}
                    </Link>
                  )}

                  <div
                    className={clsx(
                      "flex items-center rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-white/10",
                      isDesktopCollapsed ? "justify-center p-2" : "gap-x-4 px-2 py-3 bg-white/5"
                    )}
                    onClick={() => logout()}
                    title={isDesktopCollapsed ? "Logout" : undefined}
                  >
                  <div className="h-8 w-8 min-w-[32px] rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 font-bold text-xs ring-2 ring-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                    {user?.email?.[0].toUpperCase() || "U"}
                  </div>
                  {!isDesktopCollapsed && (
                    <>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-white truncate">
                          {user?.first_name || "User"}
                        </span>
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">
                          {user?.email}
                        </span>
                      </div>
                      <LogOut className="ml-auto h-4 w-4 text-gray-500 hover:text-accent-500 flex-shrink-0 transition-colors" aria-hidden="true" />
                    </>
                  )}
                </div>
              </div>
            </li>
            </ul>
          </nav>
          
          <button 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="absolute -right-3 top-20 bg-gray-800 border border-gray-700 rounded-full p-1.5 text-gray-400 hover:text-primary-400 hover:border-primary-500/50 shadow-neon z-10 transition-all hidden lg:block"
          >
            {isDesktopCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-1 min-w-0 flex-col transition-all duration-300 ease-in-out relative z-10",
          isDesktopCollapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-40 lg:hidden flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-white/10 bg-gray-900/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-300"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-4">
            <NotificationDropdown align="right" />
            <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center text-gray-900 font-bold shadow-neon">
              G
            </div>
          </div>
        </div>

        {/* Top header for desktop */}
        <div className="hidden lg:flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-gray-900/50 backdrop-blur-md px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">
              Welcome back, <span className="font-semibold text-white">{user?.first_name || user?.email?.split('@')[0] || "User"}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
               <Sparkles className="w-3.5 h-3.5 text-secondary-400" />
               <span className="text-xs font-medium text-gray-300">AI Assistant Ready</span>
            </div>
            <NotificationDropdown align="right" />
          </div>
        </div>

        <main className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
