import { Fragment, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Zap,
  Bell,
  Briefcase,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import GlobalTimer from "../components/shared/GlobalTimer";

const navigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen bg-[#F8F9FC] dark:bg-[#0B0F19] overflow-hidden flex font-sans">
      {/* Mobile sidebar placeholder transparency */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          {/* Mobile Overlay */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
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
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      G
                    </div>
                    <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
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
                                    ? "bg-gray-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400"
                                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                                  "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200",
                                )}
                              >
                                <item.icon
                                  className={clsx(
                                    location.pathname === item.href
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white",
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2 mt-2">
            <div className="h-8 w-8 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
              G
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Gero
            </span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider mb-2">
                  Platform
                </div>
                <ul role="list" className="-mx-2 space-y-2">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={clsx(
                          location.pathname === item.href
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                          "group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ease-in-out",
                        )}
                      >
                        <item.icon
                          className={clsx(
                            location.pathname === item.href
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white",
                            "h-5 w-5 shrink-0 transition-colors",
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider mb-2">
                  Workspaces
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-indigo-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800">
                        P
                      </span>
                      <span className="truncate">Product Design</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-indigo-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800">
                        E
                      </span>
                      <span className="truncate">Engineering</span>
                    </a>
                  </li>
                </ul>
              </li>

              <li className="mt-auto">
                {/* Pro Banner */}
                <div className="rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 p-4 text-white mb-6 shadow-lg shadow-indigo-200 dark:shadow-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 fill-white" />
                    <span className="font-semibold text-sm">Pro Plan</span>
                  </div>
                  <p className="text-xs text-indigo-100 mb-3">
                    Get unlimited projects and team members.
                  </p>
                  <button className="w-full rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold py-2 transition-colors">
                    Upgrade
                  </button>
                </div>

                <div
                  className="flex items-center gap-x-4 px-2 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => logout()}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white dark:ring-gray-700">
                    {user?.email?.[0].toUpperCase() || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="sr-only">Your profile</span>
                    <span
                      className="text-sm font-semibold text-gray-900 dark:text-white"
                      aria-hidden="true"
                    >
                      {user?.first_name || "User"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                      {user?.email}
                    </span>
                  </div>
                  <LogOut
                    className="ml-auto h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-40 lg:hidden flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex-1 flex justify-center">
            <GlobalTimer />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              G
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#F8F9FC] dark:bg-[#0B0F19]">

          {/* Desktop Top Bar (Optional if you want it specifically on desktop) */}
          <div className="hidden lg:flex h-16 items-center justify-end px-8 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
            <GlobalTimer />
          </div>

          <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
