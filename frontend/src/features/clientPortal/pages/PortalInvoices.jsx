import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { FileText, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

const statusStyles = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VIEWED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default function PortalInvoices() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_INVOICES);
      return res.data?.results ?? res.data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No invoices yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          When your freelancer sends an invoice, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Invoices</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              {/* In the future this can be a Link to invoice detail page */}
              <div className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {invoice.invoice_number}
                      {invoice.status === 'PAID' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {invoice.project_name || "General Invoice"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:items-end">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      GH₵{parseFloat(invoice.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Due {format(new Date(invoice.due_date), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[invoice.status] || statusStyles.DRAFT}`}>
                    {invoice.status}
                  </span>
                  <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
