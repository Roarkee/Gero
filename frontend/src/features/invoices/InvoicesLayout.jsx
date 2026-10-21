import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  DollarSign 
} from "lucide-react";

export default function InvoicesLayout() {
  const navItems = [
    { to: "/invoices", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/invoices/list", label: "Invoices", icon: FileText },
    { to: "/invoices/revenue", label: "Revenue Analytics", icon: TrendingUp },
    { to: "/invoices/collections", label: "Collection Analytics", icon: Activity },
    { to: "/invoices/client-risk", label: "Client Risk", icon: ShieldAlert },
    { to: "/invoices/cash-flow", label: "Cash Flow", icon: DollarSign },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Billing & Revenue
          </h1>
          
          <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center pb-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-[#3498DB] text-[#3498DB] dark:border-[#3498DB] dark:text-[#3498DB]"
                        : "border-transparent text-[#7F8C8D] hover:text-[#2C3E50] hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
