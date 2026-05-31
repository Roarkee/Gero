import React from "react";
import { useClients } from "../hooks/useClients";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO, isPast, isToday } from "date-fns";
import clsx from "clsx";
import { FollowUpModal } from "../components/FollowUpModal";

export default function FollowUpQueue() {
  const { data: clients, isLoading, error } = useClients();
  const [selectedClient, setSelectedClient] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (isLoading) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading Follow-ups...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading data.</div>;
  }
  // Filter clients with next_followup_at and sort ascending
  const followUps = clients
    ?.filter(c => c.next_followup_at)
    ?.sort((a, b) => new Date(a.next_followup_at).getTime() - new Date(b.next_followup_at).getTime());

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
            Follow-up Queue
          </h1>
          <p className="text-gray-500 mt-2">
            Keep your relationships moving forward. Here's who you need to contact.
          </p>
        </div>
      </div>

      {followUps?.length > 0 ? (
        <div className="space-y-4">
          {followUps.map((client) => {
            const date = parseISO(client.next_followup_at);
            const overdue = isPast(date) && !isToday(date);
            const today = isToday(date);
            
            let statusColor = "bg-gray-50 border-gray-200 text-gray-700";
            let iconColor = "text-gray-400";
            let statusLabel = "Upcoming";

            if (overdue) {
              statusColor = "bg-red-50 border-red-200 text-red-800";
              iconColor = "text-red-500";
              statusLabel = "Overdue";
            } else if (today) {
              statusColor = "bg-amber-50 border-amber-200 text-amber-800";
              iconColor = "text-amber-500";
              statusLabel = "Today";
            } else {
              statusColor = "bg-emerald-50 border-emerald-200 text-emerald-800";
              iconColor = "text-emerald-500";
            }

            return (
              <div 
                key={client.id} 
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={clsx("p-3 rounded-lg border", statusColor)}>
                    <Clock className={clsx("w-5 h-5", iconColor)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{client.name}</h3>
                      <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", statusColor)}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Scheduled for: {formatDistanceToNow(date, { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                   <button 
                     onClick={() => {
                       setSelectedClient(client);
                       setIsModalOpen(true);
                     }}
                     className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                   >
                     Reschedule
                   </button>
                  <Link 
                    to={`/clients/${client.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Contact
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No follow-ups scheduled</h3>
          <p className="text-gray-500 mb-6">You're all caught up on your outreach.</p>
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
