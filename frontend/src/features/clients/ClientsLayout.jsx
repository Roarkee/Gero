import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Users, LayoutDashboard, Trello, AlertTriangle, Calendar } from "lucide-react";
import clsx from "clsx";

export default function ClientsLayout() {
  const navItems = [
    { name: "Dashboard", to: "/clients", end: true, icon: LayoutDashboard },
    { name: "Clients List", to: "/clients/list", icon: Users },
    { name: "Pipeline", to: "/clients/board", icon: Trello },
    { name: "Attention Center", to: "/clients/attention", icon: AlertTriangle },
    { name: "Follow-ups", to: "/clients/follow-ups", icon: Calendar },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50/50 min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                      isActive
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={clsx(
                          "mr-2 h-4 w-4",
                          isActive ? "text-emerald-500" : "text-gray-400 group-hover:text-gray-500"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
