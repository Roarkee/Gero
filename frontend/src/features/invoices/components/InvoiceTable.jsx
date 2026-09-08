import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  FileText, 
  Download, 
  Trash, 
  Edit,
  ArrowRight
} from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount || 0);
};

const getStatusBadge = (status) => {
  switch(status) {
    case 'paid': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>;
    case 'overdue': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Overdue</span>;
    case 'sent': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">Sent</span>;
    case 'draft': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Draft</span>;
    case 'cancelled': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">Cancelled</span>;
    default: return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  }
};

import CreateInvoiceModal from "./CreateInvoiceModal";

export default function InvoiceTable({ invoices = [], isLoading }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-12">
         <div className="flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-500 dark:text-gray-400 font-medium">Loading invoices...</p>
         </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No invoices found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Create your first invoice or generate one from unbilled time entries.
        </p>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          Create Invoice
        </button>
        <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Invoice ID
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Issue Date
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <Link to={`/invoices/${invoice.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                      {invoice.invoice_number || `INV-${invoice.id}`}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.client_name || `Client #${invoice.client}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(invoice.total_amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/invoices/${invoice.id}`} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
