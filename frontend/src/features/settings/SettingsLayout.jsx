import { NavLink, Outlet } from "react-router-dom";
import { CreditCard, User } from "lucide-react";
import { clsx } from "clsx";

const settingsNav = [
  { name: "Payments", href: "/settings/payments", icon: CreditCard },
  { name: "Profile",         href: "/settings/profile",  icon: User, disabled: true },
];

export default function SettingsLayout() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account preferences.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 space-y-1">
          {settingsNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  item.disabled
                    ? "text-gray-300 dark:text-gray-600 pointer-events-none cursor-default"
                    : isActive
                    ? "bg-[#3498DB]/10 dark:bg-[#3498DB]/20 text-[#3498DB] dark:text-[#3498DB]"
                    : "text-[#7F8C8D] dark:text-gray-400 hover:bg-[#ECF0F1] dark:hover:bg-gray-800 hover:text-[#2C3E50] dark:hover:text-white"
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
              {item.disabled && (
                <span className="ml-auto text-[9px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
