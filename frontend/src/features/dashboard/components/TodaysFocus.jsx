import { format } from "date-fns";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react";

export default function TodaysFocus({
  overdueInvoices,
  tasksDueSoon,
  kpis,
  clientsWaiting,
}) {
  const todayDate = format(new Date(), "EEEE, MMMM do");

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Today's Focus</h2>
          <p className="text-indigo-100">{todayDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Due Today / Soon Tasks */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-300" />
            <h3 className="font-medium text-indigo-50">Tasks Due Soon</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {tasksDueSoon?.length || 0}
          </div>
          <p className="text-sm text-indigo-200">Tasks require attention</p>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <h3 className="font-medium text-indigo-50">Overdue Invoices</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {overdueInvoices?.length || 0}
          </div>
          <p className="text-sm text-indigo-200">
            GHS {kpis?.overdue_invoice_amount || "0.00"} outstanding
          </p>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-300" />
            <h3 className="font-medium text-indigo-50">Monthly Profit</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            GHS {kpis?.profit_this_month || "0.00"}
          </div>
          <p className="text-sm text-indigo-200">Net profit this month</p>
        </div>

        {/* Client Comms */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-300" />
            <h3 className="font-medium text-indigo-50">Client Follow-ups</h3>
          </div>
          <div className="text-2xl font-bold mb-1">
            {clientsWaiting?.length || 0}
          </div>
          <p className="text-sm text-indigo-200">Clients waiting on response</p>
        </div>
      </div>
    </div>
  );
}
