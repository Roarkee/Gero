import { useState } from "react";
import { useInvoices } from "../../api/queries/useInvoices";
import {
  FileText,
  Plus,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "../../components/ui";
import { format } from "date-fns";
import CreateInvoiceModal from "./CreateInvoiceModal";

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'sent': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'overdue': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200'; // draft
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'sent': return <RefreshCw className="w-3 h-3 mr-1" />;
      case 'overdue': return <AlertCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Invoices
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage billing, payments, and generated reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            className="shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all rounded-xl"
            onClick={() => setInvoiceModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Content */}
      {(!invoices || invoices.length === 0) ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="mx-auto h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No invoices yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Create your first invoice or auto-generate one from your tracked time entries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-lg transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between h-56"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-full border flex items-center text-xs font-semibold uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                  {invoice.title || "Untitled Invoice"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate mb-1">
                  {invoice.client_name} {invoice.project_name && `• ${invoice.project_name}`}
                </p>
                <p className="text-xs text-gray-400">
                  {invoice.invoice_number}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Due Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(new Date(invoice.due_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Amount</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${parseFloat(invoice.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} />
    </div>
  );
}
