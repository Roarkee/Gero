import React from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { HealthIndicator } from "./HealthIndicator";
import { Building2, Calendar } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import clsx from "clsx";

export function ClientCard({ client, className }) {
  return (
    <Link 
      to={`/clients/${client.id}`}
      className={clsx(
        "block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all cursor-pointer",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{client.name}</h3>
          {client.company_name && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              {client.company_name}
            </div>
          )}
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <HealthIndicator score={client.health_score} label={client.health_label} />
        
        {client.attention_required && (
          <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10">
            Needs Attention
          </span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {client.next_followup_at ? (
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            <span>Follow-up: {formatDistanceToNow(parseISO(client.next_followup_at), { addSuffix: true })}</span>
          </div>
        ) : (
          <span className="italic text-gray-400">No follow-up</span>
        )}
        
        {client.lifetime_value > 0 && (
          <div className="flex items-center font-medium text-gray-700 dark:text-gray-300">
            <span>GH₵ {Number(client.lifetime_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
