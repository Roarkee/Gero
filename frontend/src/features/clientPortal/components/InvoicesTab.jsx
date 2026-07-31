import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CreditCard } from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

const statusStyles = {
  draft:          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  sent:           "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  viewed:         "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  partially_paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  overdue:        "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  cancelled:      "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

const fmt = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);

function InvoiceDetail({ invoiceId, onBack }) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["portal", "invoice", invoiceId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_INVOICE_DETAIL(invoiceId));
      return res.data;
    },
  });

  if (isLoading) return <div className="animate-pulse h-64 rounded-xl bg-gray-100 dark:bg-gray-700" />;
  if (!invoice) return null;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{invoice.invoice_number}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{invoice.title}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyles[invoice.status] || statusStyles.draft}`}>
          {invoice.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-0.5">Issue date</p>
          <p className="text-gray-900 dark:text-white font-medium">
            {invoice.issue_date ? format(new Date(invoice.issue_date), "MMM d, yyyy") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-0.5">Due date</p>
          <p className="text-gray-900 dark:text-white font-medium">
            {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "—"}
          </p>
        </div>
      </div>

      {/* Line items */}
      {invoice.items?.length > 0 && (
        <table className="w-full text-sm border-t border-gray-100 dark:border-gray-700">
          <thead>
            <tr className="text-xs text-gray-400 dark:text-gray-500 uppercase">
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-right font-medium w-16">Qty</th>
              <th className="py-2 text-right font-medium w-24">Rate</th>
              <th className="py-2 text-right font-medium w-24">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-gray-700 dark:text-gray-300">{item.description}</td>
                <td className="py-2 text-right text-gray-500 dark:text-gray-400">{item.quantity}</td>
                <td className="py-2 text-right text-gray-500 dark:text-gray-400">{fmt(item.rate)}</td>
                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-500 dark:text-gray-400">
          <span>Tax ({invoice.tax_rate}%)</span><span>{fmt(invoice.tax_amount)}</span>
        </div>
        <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
          <span>Total</span>
          <span className="text-indigo-600 dark:text-indigo-400">{fmt(invoice.total_amount)}</span>
        </div>
      </div>

      {/* Payment methods */}
      {invoice.payment_methods?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 font-medium">How to pay</p>
          <div className="flex flex-wrap gap-2">
            {invoice.payment_methods.map((pm) => (
              <span key={pm.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                {pm.display_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      {invoice.payments_received?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2 font-medium">Payment history</p>
          <div className="space-y-1.5">
            {invoice.payments_received.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {format(new Date(p.payment_date), "MMM d, yyyy")} · {p.method || "Manual"}
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicesTab({ projectId }) {
  const [selectedId, setSelectedId] = useState(null);

  const { data: allInvoices = [], isLoading } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_INVOICES);
      return res.data?.results ?? res.data ?? [];
    },
  });

  // Filter to invoices for this project
  const invoices = allInvoices.filter(
    (inv) => inv.project_name !== null || inv.project_name === null
  );

  if (isLoading) return <div className="animate-pulse h-40 rounded-xl bg-gray-100 dark:bg-gray-700" />;

  if (selectedId) {
    return <InvoiceDetail invoiceId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (!invoices.length) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No invoices yet.</p>;
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <button
          key={inv.id}
          onClick={() => setSelectedId(inv.id)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all text-left group"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.invoice_number}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{inv.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[inv.status] || statusStyles.draft}`}>
              {inv.status.replace("_", " ")}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(inv.total_amount)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
