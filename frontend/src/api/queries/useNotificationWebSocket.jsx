import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Bell } from "lucide-react";

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
  const navigate = useNavigate();
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

        // Invalidate queries so that badge, notification lists, and related data refresh
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        const notifType = data.type || "";
        if (notifType.includes("payment") || notifType.includes("invoice")) {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }

        const title = data.title || "New Notification";
        const message = data.message || "";
        const actionUrl = data.extra?.action_url;
        const isPayment = notifType === "payment_received" || notifType === "invoice_paid";

        toast.custom(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                if (actionUrl) {
                  navigate(actionUrl);
                }
              }}
              className={`flex items-start gap-3 bg-white dark:bg-gray-800 border rounded-xl shadow-xl px-4 py-3 max-w-sm cursor-pointer transition-all hover:scale-[1.02] ${
                isPayment
                  ? "border-emerald-500/40 dark:border-emerald-500/30 ring-1 ring-emerald-500/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {isPayment ? (
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-5 h-5 text-indigo-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                  {title}
                </p>
                {message && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                    {message}
                  </p>
                )}
                {actionUrl && (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1.5 flex items-center gap-1">
                    View details &rarr;
                  </p>
                )}
              </div>
            </div>
          ),
          { duration: 6000 }
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
  }, [queryClient, navigate]);

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
