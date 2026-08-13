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
    <div className="h-screen flex bg-gray-900 bg-mesh-dark bg-fixed overflow-hidden font-sans text-gray-50">
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-60 backdrop-blur-xl bg-gray-900/40 border-r border-white/10 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-white/10 gap-3 shrink-0">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-neon-purple transition-transform hover:scale-105">
            G
          </div>
          <div className="leading-tight">
            <p className="text-sm font-heading font-bold text-white text-neon-cyan">Gero</p>
            <p className="text-[10px] uppercase tracking-widest text-primary-200/70 font-semibold">Client Portal</p>
          </div>
          <button
            className="lg:hidden ml-auto p-1 text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <Link
            to="/portal/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
              location.pathname === "/portal/dashboard"
                ? "bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
            {location.pathname === "/portal/dashboard" && (
               <div className="absolute inset-0 bg-primary-500/10 blur-xl opacity-50" />
            )}
            <Home className={clsx("w-4 h-4 shrink-0 relative z-10", location.pathname === "/portal/dashboard" ? "text-primary-400" : "text-gray-500 group-hover:text-primary-400")} />
            <span className="relative z-10">Dashboard</span>
          </Link>
          <Link
            to="/portal/projects"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
              location.pathname.startsWith("/portal/projects")
                ? "bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
             {location.pathname.startsWith("/portal/projects") && (
               <div className="absolute inset-0 bg-primary-500/10 blur-xl opacity-50" />
            )}
            <Briefcase className={clsx("w-4 h-4 shrink-0 relative z-10", location.pathname.startsWith("/portal/projects") ? "text-primary-400" : "text-gray-500 group-hover:text-primary-400")} />
            <span className="relative z-10">My Projects</span>
          </Link>
          <Link
            to="/portal/invoices"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
              location.pathname.startsWith("/portal/invoices")
                ? "bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            )}
          >
             {location.pathname.startsWith("/portal/invoices") && (
               <div className="absolute inset-0 bg-primary-500/10 blur-xl opacity-50" />
            )}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={clsx("shrink-0 relative z-10", location.pathname.startsWith("/portal/invoices") ? "text-primary-400" : "text-gray-500 group-hover:text-primary-400")}><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 10h8"/><path d="M8 14h8"/><path d="M8 18h8"/><path d="M8 6h.01"/></svg>
            <span className="relative z-10">Invoices</span>
          </Link>
          <Link
            to="/portal/request"
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group mt-4 border border-secondary-500/30 hover:border-secondary-500/60 shadow-[0_0_15px_rgba(123,47,255,0.1)] hover:shadow-[0_0_20px_rgba(123,47,255,0.2)]",
              isRequest
                ? "bg-secondary-900/50 text-secondary-300"
                : "bg-secondary-900/20 text-gray-300"
            )}
          >
            <PlusCircle className={clsx("w-4 h-4 shrink-0 relative z-10", isRequest ? "text-secondary-400" : "text-secondary-500 group-hover:text-secondary-400")} />
            <span className="relative z-10">New Request</span>
          </Link>

          {user?.has_freelancer_portal && (
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 mt-6 rounded-xl text-xs font-semibold text-primary-300 bg-primary-900/30 border border-primary-500/20 hover:bg-primary-900/50 hover:border-primary-500/50 transition-all shadow-neon"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              Freelancer Workspace &rarr;
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 font-bold text-xs shrink-0 ring-2 ring-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.email}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-accent-500 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile header */}
        <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-white/10 flex items-center px-4 lg:hidden shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 text-sm font-heading font-bold text-white text-neon-cyan">Gero Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
           <div className="max-w-7xl mx-auto w-full animate-fade-in">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
