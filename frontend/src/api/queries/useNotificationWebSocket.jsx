import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const WS_BASE_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:8000")
    .replace(/^http/, "ws")
    .replace(/\/$/, "");

/**
 * Connects to the Django Channels notification WebSocket.
 * Automatically reconnects on unexpected close (exponential back-off).
 * Invalidates the notifications query on each incoming event.
 */
export function useNotificationWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(1000);

  const connect = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const url = `${WS_BASE_URL}/ws/notifications/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectDelayRef.current = 1000;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Refresh the bell icon and notifications list
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        const title = data.title || "New Notification";
        const message = data.message || "";

        toast.custom(
          () => (
            <div className="flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 max-w-sm">
              <span className="text-indigo-500 mt-0.5">🔔</span>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{title}</p>
                {message && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
                )}
              </div>
            </div>
          ),
          { duration: 5000 }
        );
      } catch {
        // Malformed message — ignore
      }
    };

    ws.onclose = (event) => {
      if (event.code === 1000 || event.code === 1001) return;
      const delay = Math.min(reconnectDelayRef.current, 30000);
      reconnectDelayRef.current = delay * 2;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect]);
}
