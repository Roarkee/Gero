import { Link } from "react-router-dom";
import { AlertCircle, Calendar, Users, Clock } from "lucide-react";

export default function NeedsAttention({
  overdueInvoices,
  upcomingDeadlines,
  tasksDueSoon,
  clientsWaiting,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 mb-8 overflow-hidden">
      <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-red-800">Needs Attention</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Overdue Invoices */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSignIcon className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-800">Overdue Invoices</h3>
          </div>
          {overdueInvoices?.length > 0 ? (
            <ul className="space-y-3">
              {overdueInvoices.map((inv) => (
                <li key={inv.id} className="flex justify-between items-center text-sm">
                  <div>
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {inv.invoice_number}
                    </Link>
                    <span className="text-gray-500 ml-2">{inv.client_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-medium text-gray-900">${inv.amount_due}</span>
                    <span className="text-xs text-red-500">{inv.days_overdue} days late</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No overdue invoices! 🎉</p>
          )}
        </div>

        {/* Tasks Due Soon */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-gray-800">Tasks Due Soon</h3>
          </div>
          {tasksDueSoon?.length > 0 ? (
            <ul className="space-y-3">
              {tasksDueSoon.map((task) => (
                <li key={task.id} className="flex justify-between items-center text-sm">
                  <div>
                    <Link
                      to={`/projects/${task.project_id}?tab=tasks`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {task.task_title}
                    </Link>
                    <span className="block text-xs text-gray-500">{task.project_name}</span>
                  </div>
                  <span className="text-orange-600 font-medium whitespace-nowrap">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : "Soon"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No urgent tasks.</p>
          )}
        </div>

        {/* Projects Near Deadline */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Upcoming Deadlines</h3>
          </div>
          {upcomingDeadlines?.length > 0 ? (
            <ul className="space-y-3">
              {upcomingDeadlines.map((proj) => (
                <li key={proj.id} className="flex justify-between items-center text-sm">
                  <div>
                    <Link
                      to={`/projects/${proj.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {proj.project_name}
                    </Link>
                    <span className="block text-xs text-gray-500">{proj.client_name}</span>
                  </div>
                  <span className="text-yellow-600 font-medium">
                    {proj.days_remaining} days left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No immediate deadlines.</p>
          )}
        </div>

        {/* Clients Waiting */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Clients Waiting</h3>
          </div>
          {clientsWaiting?.length > 0 ? (
            <ul className="space-y-3">
              {clientsWaiting.map((client) => (
                <li key={client.id} className="flex justify-between items-center text-sm">
                  <Link
                    to={`/clients/${client.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {client.client_name}
                  </Link>
                  <span className="text-gray-500 text-xs">
                    Since {new Date(client.last_activity_date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">All clients are engaged.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DollarSignIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
