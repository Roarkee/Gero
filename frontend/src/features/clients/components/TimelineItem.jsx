import React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MessageSquare, RefreshCcw, Mail, Phone, Users, PlusCircle, CheckCircle, Calendar, AlertCircle } from "lucide-react";

const ACTIVITY_ICONS = {
  note: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-100" },
  status_change: { icon: RefreshCcw, color: "text-purple-500", bg: "bg-purple-100" },
  email: { icon: Mail, color: "text-indigo-500", bg: "bg-indigo-100" },
  call: { icon: Phone, color: "text-emerald-500", bg: "bg-emerald-100" },
  meeting: { icon: Users, color: "text-amber-500", bg: "bg-amber-100" },
  project_created: { icon: PlusCircle, color: "text-cyan-500", bg: "bg-cyan-100" },
  project_completed: { icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-100" },
  client_created: { icon: PlusCircle, color: "text-gray-500", bg: "bg-gray-100" },
  follow_up_scheduled: { icon: Calendar, color: "text-pink-500", bg: "bg-pink-100" },
  follow_up_completed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  invoice_paid: { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
  invoice_overdue: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100" },
};

function DollarSign(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
}

export function TimelineItem({ activity, isLast }) {
  const config = ACTIVITY_ICONS[activity.activity_type] || { icon: MessageSquare, color: "text-gray-500", bg: "bg-gray-100" };
  const Icon = config.icon;

  return (
    <li className="relative pb-8">
      {!isLast && (
        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
      )}
      <div className="relative flex space-x-3">
        <div>
          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${config.bg}`}>
            <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
          <div>
            <p className="text-sm text-gray-800">
              {activity.description}
            </p>
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-md p-2 border border-gray-100">
                <pre className="font-mono text-[10px] whitespace-pre-wrap">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <div className="whitespace-nowrap text-right text-xs text-gray-500">
            <time dateTime={activity.created_at}>
              {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
            </time>
          </div>
        </div>
      </div>
    </li>
  );
}
