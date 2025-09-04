import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return; // Don't fetch if no user

    try {
      setLoading(true);
      const response = await api.get("/notifications/");
      setNotifications(response.data.results || []);

      // Get unread count
      const unreadResponse = await api.get(
        "/notifications/unread_notifications_number/"
      );
      setUnreadCount(unreadResponse.data.unread_notifications || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Don't show error toast on initial load to avoid spamming
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/mark_read/`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/mark_all_read/");
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Check for overdue items - your Celery tasks handle this automatically
  const checkOverdueItems = async () => {
    if (!user) return; // Don't check if no user

    // Your Celery tasks (notify_invoice_overdue, notify_task_deadline)
    // handle checking for overdue items automatically
    // We just need to refresh notifications periodically
    try {
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    }
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      checkOverdueItems();

      // Poll for new notifications every 5 minutes
      const interval = setInterval(() => {
        fetchNotifications();
        checkOverdueItems();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    checkOverdueItems,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
