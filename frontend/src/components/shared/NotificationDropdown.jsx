import React from "react";
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { Bell, CheckCircle2, Clock, AlertTriangle, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useNotifications } from "../../api/queries/useNotifications";

const getNotificationIcon = (type) => {
  switch (type) {
    case "invoice_overdue":
    case "task_overdue":
    case "follow_up_overdue":
      return <Clock className="w-5 h-5 text-red-500" />;
    case "budget_exceeded":
    case "budget_warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "payment_received":
    case "invoice_paid":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case "invoice_viewed":
      return <Bell className="w-5 h-5 text-blue-500" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-500" />;
  }
};

export default function NotificationDropdown({ align = "left" }) {
  const { notificationsQuery, unreadCountQuery, markReadMutation, markAllReadMutation } = useNotifications();

  const notifications = notificationsQuery.data?.results || notificationsQuery.data || [];
  const unreadCount = unreadCountQuery.data?.unread_notifications || 0;

  const handleMarkAsRead = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    markReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = (e) => {
    e.preventDefault();
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  const positionClass = align === "right"
    ? "right-0 origin-top-right"
    : "left-0 origin-top-left";

  return (
    <Popover className="relative">
      <PopoverButton className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
        )}
      </PopoverButton>

      <Transition
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className={`absolute ${positionClass} z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 focus:outline-none overflow-hidden flex flex-col max-h-[32rem]`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notificationsQuery.isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">All caught up!</p>
                <p className="text-xs text-gray-500">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${
                    !notification.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                  }`}
                >
                  {notification.action_url ? (
                    <Link to={notification.action_url} className="absolute inset-0 z-0 rounded-xl" />
                  ) : null}
                  
                  <div className="shrink-0 mt-1 z-10 pointer-events-none">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 pointer-events-none">
                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="shrink-0 flex items-start z-10 relative">
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50 dark:bg-gray-900/50">
            <Link to="/notifications" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors flex items-center justify-center gap-1">
              View All Notifications &rarr;
            </Link>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
