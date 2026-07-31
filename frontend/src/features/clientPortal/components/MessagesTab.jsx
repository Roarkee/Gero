import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { format } from "date-fns";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";
import { useAuthStore } from "../../../store/authStore";

export default function MessagesTab({ projectId }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [body, setBody] = useState("");
  const bottomRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["portal", "messages", projectId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_MESSAGES(projectId));
      return res.data?.results ?? res.data ?? [];
    },
    refetchInterval: 15000,
  });

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: (text) =>
      apiClient.post(API_ENDPOINTS.PORTAL_MESSAGES(projectId), { body: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "messages", projectId] });
      setBody("");
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    send.mutate(text);
  };

  if (isLoading) {
    return <div className="animate-pulse h-40 rounded-xl bg-gray-100 dark:bg-gray-700" />;
  }

  return (
    <div className="flex flex-col h-[28rem]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.is_mine;
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                mine
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
              }`}>
                {msg.body}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                {msg.sender_name} · {format(new Date(msg.created_at), "MMM d, h:mm a")}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          rows={2}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!body.trim() || send.isPending}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
