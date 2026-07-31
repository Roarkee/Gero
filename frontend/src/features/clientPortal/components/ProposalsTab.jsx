import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

const statusBadge = {
  pending:            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:           "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  revision_requested: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

function ProposalCard({ proposal, projectId }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(proposal.status === "pending");
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  const act = useMutation({
    mutationFn: ({ action, note }) =>
      apiClient.post(
        API_ENDPOINTS.PORTAL_PROPOSAL_ACTION(projectId, proposal.id, action),
        { note }
      ),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["portal", "proposals", projectId] });
      const labels = { approve: "Proposal approved.", reject: "Proposal rejected.", request_revision: "Revision requested." };
      toast.success(labels[action] || "Done.");
      setPendingAction(null);
      setNote("");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.detail || "Action failed."),
  });

  const canAct = proposal.status === "pending";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${statusBadge[proposal.status]}`}>
            {proposal.status.replace("_", " ")}
          </span>
          <span className="font-medium text-gray-900 dark:text-white truncate">{proposal.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
            {format(new Date(proposal.created_at), "MMM d, yyyy")}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <ProposalContent content={proposal.content} />

          {/* Client note (if already actioned) */}
          {proposal.client_note && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-700 dark:text-gray-200">Your note: </span>
              {proposal.client_note}
            </div>
          )}

          {/* Action buttons */}
          {canAct && (
            <div className="space-y-3 pt-1">
              {pendingAction === "request_revision" && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Describe what needs to be changed…"
                  className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {pendingAction !== "request_revision" ? (
                  <>
                    <button
                      onClick={() => act.mutate({ action: "approve", note: "" })}
                      disabled={act.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setPendingAction("request_revision")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Request revision
                    </button>
                    <button
                      onClick={() => act.mutate({ action: "reject", note: "" })}
                      disabled={act.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => act.mutate({ action: "request_revision", note })}
                      disabled={!note.trim() || act.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Send revision request
                    </button>
                    <button
                      onClick={() => { setPendingAction(null); setNote(""); }}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Renders the JSON proposal content in a readable way. */
function ProposalContent({ content }) {
  if (!content) return null;
  // If it's a string, just render it
  if (typeof content === "string") {
    return <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{content}</p>;
  }
  // Otherwise render each top-level key as a section
  return (
    <div className="space-y-3">
      {Object.entries(content).map(([key, value]) => (
        <div key={key}>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {key.replace(/_/g, " ")}
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {typeof value === "object" ? (
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="whitespace-pre-wrap">{String(value)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProposalsTab({ projectId }) {
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["portal", "proposals", projectId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_PROPOSALS(projectId));
      return res.data?.results ?? res.data ?? [];
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-40 rounded-xl bg-gray-100 dark:bg-gray-700" />;
  }

  if (!proposals.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
        No proposals have been shared yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} projectId={projectId} />
      ))}
    </div>
  );
}
