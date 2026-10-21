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
    // h-full fills the overflow:hidden main. flex-col stacks nav + content.
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Nav bar — flex-shrink-0 so it never collapses */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
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
                        ? "border-[#3498DB] text-[#3498DB]"
                        : "border-transparent text-[#7F8C8D] hover:text-[#2C3E50] hover:border-gray-300"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={clsx(
                          "mr-2 h-4 w-4",
                          isActive ? "text-[#3498DB]" : "text-[#7F8C8D] group-hover:text-[#2C3E50]"
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

      {/* Content area — flex-1 min-h-0 so it takes remaining height and scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
