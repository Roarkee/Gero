import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Tag,
  PiggyBank,
} from "lucide-react";

export default function ExpensesLayout() {
  const navItems = [
    { to: "/expenses", end: true, label: "Overview", icon: LayoutDashboard },
    { to: "/expenses/list", label: "Expenses", icon: Receipt },
    { to: "/expenses/categories", label: "Categories", icon: Tag },
    { to: "/expenses/budgets", label: "Budgets", icon: PiggyBank },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Expenses & Budgets
          </h1>
          <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center pb-4 px-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
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
