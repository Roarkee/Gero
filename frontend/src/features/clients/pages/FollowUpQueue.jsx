import React, { useState, useMemo } from "react";
import { useClients, useUpdateClient, useCreateClientActivity } from "../hooks/useClients";
import { Calendar, Clock, ArrowRight, Phone, Mail, Users, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO, isPast, isToday, isTomorrow, format, differenceInDays } from "date-fns";
import clsx from "clsx";
import { FollowUpModal } from "../components/FollowUpModal";
import { HealthIndicator } from "../components/HealthIndicator";
import { StatusBadge } from "../components/StatusBadge";
import toast from "react-hot-toast";

function QuickActionBar({ client, onReschedule }) {
  const createActivity = useCreateClientActivity();
  const updateClient = useUpdateClient();
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDescription, setLogDescription] = useState("");
  const [logType, setLogType] = useState("call");

  const handleLogActivity = (e) => {
    e.preventDefault();
    if (!logDescription.trim()) return;
    createActivity.mutate(
      { id: client.id, activity_type: logType, description: logDescription },
      {
        onSuccess: () => {
          toast.success(`${logType.charAt(0).toUpperCase() + logType.slice(1)} logged!`);
          setShowLogForm(false);
          setLogDescription("");
        },
        onError: () => toast.error("Failed to log activity"),
      }
    );
  };

  const handleMarkDone = () => {
    // Clear the follow-up by setting it to null
    updateClient.mutate(
      { id: client.id, next_followup_at: null },
      {
        onSuccess: () => toast.success(`Follow-up for ${client.name} completed!`),
        onError: () => toast.error("Failed to mark as done"),
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Phone className="w-3.5 h-3.5 mr-1" />
          Log Contact
        </button>
        <button
          onClick={onReschedule}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 mr-1" />
          Reschedule
        </button>
        <button
          onClick={handleMarkDone}
          disabled={updateClient.isPending}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {updateClient.isPending ? "..." : "Done"}
        </button>
        <Link
          to={`/clients/${client.id}`}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          View
          <ArrowRight className="ml-1 w-3.5 h-3.5" />
        </Link>
      </div>

      {showLogForm && (
        <form onSubmit={handleLogActivity} className="flex items-center gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="text-xs border border-gray-300 rounded-md p-1.5 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <input
            type="text"
            required
            placeholder="Brief summary of the interaction..."
            value={logDescription}
            onChange={(e) => setLogDescription(e.target.value)}
            className="flex-1 text-xs border border-gray-300 rounded-md p-1.5 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={createActivity.isPending}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createActivity.isPending ? "..." : "Log"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function FollowUpQueue() {
  const { data: clients, isLoading, error } = useClients();
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { overdue, today, upcoming, noFollowUp } = useMemo(() => {
    if (!clients) return { overdue: [], today: [], upcoming: [], noFollowUp: [] };

    const withFollowUp = clients.filter((c) => c.next_followup_at);
    const withoutFollowUp = clients.filter((c) => !c.next_followup_at && c.status !== "completed" && c.status !== "churned");

    const sorted = withFollowUp.sort(
      (a, b) => new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime()
    );

    return {
      overdue: sorted.filter((c) => {
        const d = parseISO(c.next_followup_at);
        return isPast(d) && !isToday(d);
      }),
      today: sorted.filter((c) => isToday(parseISO(c.next_followup_at))),
      upcoming: sorted.filter((c) => {
        const d = parseISO(c.next_followup_at);
        return !isPast(d) && !isToday(d);
      }),
      noFollowUp: withoutFollowUp,
    };
  }, [clients]);

  if (isLoading) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading Follow-ups...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading data.</div>;
  }

  const renderFollowUpCard = (client, urgency) => {
    const date = parseISO(client.next_followup_at);
    const isExpanded = expandedId === client.id;
    const daysSinceContact = client.last_contacted_at
      ? differenceInDays(new Date(), parseISO(client.last_contacted_at))
      : null;

    let borderColor = "border-l-gray-300";
    let urgencyBadge = null;

    if (urgency === "overdue") {
      const daysOverdue = differenceInDays(new Date(), date);
      borderColor = "border-l-red-500";
      urgencyBadge = (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
          {daysOverdue}d overdue
        </span>
      );
    } else if (urgency === "today") {
      borderColor = "border-l-amber-500";
      urgencyBadge = (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          Today
        </span>
      );
    } else if (isTomorrow(date)) {
      borderColor = "border-l-blue-400";
      urgencyBadge = (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          Tomorrow
        </span>
      );
    } else {
      borderColor = "border-l-emerald-400";
      urgencyBadge = (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
          {format(date, "MMM d")}
        </span>
      );
    }

    return (
      <div
        key={client.id}
        className={clsx(
          "bg-white border-l-4 border-y border-r border-gray-200 rounded-r-xl shadow-sm hover:shadow-md transition-shadow",
          borderColor
        )}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : client.id)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                {client.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 truncate">{client.name}</h3>
                  {urgencyBadge}
                  <StatusBadge status={client.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(date, { addSuffix: true })}
                  </span>
                  {daysSinceContact !== null && (
                    <span className={clsx(
                      "flex items-center",
                      daysSinceContact > 14 ? "text-red-500 font-medium" : ""
                    )}>
                      <Mail className="w-3 h-3 mr-1" />
                      Last contact: {daysSinceContact === 0 ? "today" : `${daysSinceContact}d ago`}
                    </span>
                  )}
                  {client.lifetime_value > 0 && (
                    <span className="font-medium text-gray-700">
                      ${Number(client.lifetime_value).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <HealthIndicator score={client.health_score} label={client.health_label} />
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <QuickActionBar
              client={client}
              onReschedule={() => {
                setSelectedClient(client);
                setIsModalOpen(true);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const totalScheduled = overdue.length + today.length + upcoming.length;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
          Follow-up Queue
        </h1>
        <p className="text-gray-500 mt-2">
          Keep your relationships moving forward. Here's who you need to contact.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Scheduled</div>
          <div className="text-2xl font-bold text-gray-900">{totalScheduled}</div>
        </div>
        <div className={clsx("rounded-xl p-4 shadow-sm border", overdue.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200")}>
          <div className={clsx("text-xs uppercase tracking-wider mb-1", overdue.length > 0 ? "text-red-600" : "text-gray-500")}>
            <AlertTriangle className="w-3 h-3 inline mr-1" /> Overdue
          </div>
          <div className={clsx("text-2xl font-bold", overdue.length > 0 ? "text-red-700" : "text-gray-900")}>{overdue.length}</div>
        </div>
        <div className={clsx("rounded-xl p-4 shadow-sm border", today.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200")}>
          <div className={clsx("text-xs uppercase tracking-wider mb-1", today.length > 0 ? "text-amber-600" : "text-gray-500")}>Today</div>
          <div className={clsx("text-2xl font-bold", today.length > 0 ? "text-amber-700" : "text-gray-900")}>{today.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Upcoming</div>
          <div className="text-2xl font-bold text-gray-900">{upcoming.length}</div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-3">
            {overdue.map((c) => renderFollowUpCard(c, "overdue"))}
          </div>
        </div>
      )}

      {/* Today Section */}
      {today.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3">
            Due Today ({today.length})
          </h2>
          <div className="space-y-3">
            {today.map((c) => renderFollowUpCard(c, "today"))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((c) => renderFollowUpCard(c, "upcoming"))}
          </div>
        </div>
      )}

      {/* No follow-up scheduled */}
      {noFollowUp.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            No Follow-up Scheduled ({noFollowUp.length})
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {noFollowUp.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(c);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  {c.name}
                  <Calendar className="w-3 h-3 ml-1.5 text-gray-400" />
                </button>
              ))}
              {noFollowUp.length > 10 && (
                <span className="px-3 py-1.5 text-xs text-gray-500">
                  +{noFollowUp.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalScheduled === 0 && noFollowUp.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Inbox Zero!</h3>
          <p className="text-gray-600">You're completely caught up. No follow-ups are scheduled.</p>
        </div>
      )}

      <FollowUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
