import React, { useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Check, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  ArrowRight,
  ExternalLink,
  Inbox
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "react-router-dom";
import { useNotifications } from "../../../api/queries/useNotifications";
import clsx from "clsx";

const getNotificationIcon = (type) => {
  switch (type) {
    case "invoice_overdue":
    case "task_overdue":
    case "follow_up_overdue":
      return <Clock className="w-5 h-5 text-red-500 shrink-0" />;
    case "budget_exceeded":
    case "budget_warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
    case "payment_received":
    case "invoice_paid":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    case "invoice_viewed":
      return <Bell className="w-5 h-5 text-blue-500 shrink-0" />;
    default:
      return <Bell className="w-5 h-5 text-indigo-500 shrink-0" />;
  }
};

export default function NotificationsPage() {
  const { notificationsQuery, unreadCountQuery, markReadMutation, markAllReadMutation } = useNotifications();
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'invoices' | 'payments' | 'projects'

  const notifications = notificationsQuery.data?.results || notificationsQuery.data || [];
  const unreadCount = unreadCountQuery.data?.unread_notifications || 0;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.is_read;
    if (filter === "invoices") return item.type.includes("invoice");
    if (filter === "payments") return item.type.includes("payment") || item.type.includes("paid");
    if (filter === "projects") return item.type.includes("project") || item.type.includes("task");
    return true;
  });

  const handleMarkAsRead = (id) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay updated with client activity, invoice updates, payments, and deadlines.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto">
        {[
          { id: "all", label: "All Notifications", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          { id: "invoices", label: "Invoices", count: notifications.filter(n => n.type.includes("invoice")).length },
          { id: "payments", label: "Payments", count: notifications.filter(n => n.type.includes("payment")).length },
          { id: "projects", label: "Projects & Tasks", count: notifications.filter(n => n.type.includes("project") || n.type.includes("task")).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={clsx(
              "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2",
              filter === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
            )}
          >
            {tab.label}
            <span
              className={clsx(
                "px-1.5 py-0.5 rounded-full text-[10px]",
                filter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 space-y-3 pb-12 overflow-y-auto pr-2">
        {notificationsQuery.isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="text-sm text-gray-500 mt-4">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No notifications found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {filter === "unread"
                ? "You have read all your notifications! Great job keeping up."
                : "Notifications will appear here as activity occurs across your workspace."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={clsx(
                "bg-white dark:bg-gray-800 rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                !item.is_read
                  ? "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/10 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={clsx(
                      "text-sm font-semibold truncate",
                      !item.is_read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {item.title}
                    </h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.message}
                  </p>

                  <span className="text-[11px] font-medium text-gray-400 mt-2 block">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    {" • "}
                    {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {item.action_url && (
                  <Link
                    to={item.action_url}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    disabled={markReadMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
