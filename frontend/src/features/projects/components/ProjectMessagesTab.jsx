import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export default function ProjectMessagesTab({ project }) {
  const projectId = project?.id;
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const bottomRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["project", "messages", projectId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_FREELANCER_MESSAGE(projectId));
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
      apiClient.post(API_ENDPOINTS.PORTAL_FREELANCER_MESSAGE(projectId), { body: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", "messages", projectId] });
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
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-4" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-4 shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          Client Portal Messages
        </h3>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" />
            <p>No messages yet. Send a message to the client's portal.</p>
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.is_mine;
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                mine
                  ? "bg-indigo-600 text-white rounded-br-sm shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
              }`}>
                {msg.body}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                {msg.sender_name} A {format(new Date(msg.created_at), "MMM d, h:mm a")}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
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
          placeholder="Type a message to the client... (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!body.trim() || send.isPending}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors shrink-0 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
