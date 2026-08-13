import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/endpoints';
import PaymentForm from '../../payments/components/PaymentForm';

const fetchPublicInvoice = async (id) => {
  const { data } = await apiClient.get(API_ENDPOINTS.PUBLIC_INVOICE_DETAIL(id));
  return data;
};

const PublicInvoice = () => {
  const { id } = useParams();

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['public-invoice', id],
    queryFn: () => fetchPublicInvoice(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500 text-lg">
          {error?.response?.data?.detail || "Could not load invoice."}
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-lg overflow-hidden border border-gray-100 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200 dark:border-slate-700 sm:px-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              INVOICE
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {invoice.invoice_number}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {invoice.freelancer?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {invoice.freelancer?.email}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-8 sm:px-10">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
              <div className="text-gray-800 dark:text-gray-200 font-medium">{invoice.client?.name}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">{invoice.client?.email}</div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-1">Issue Date</span>
                <span className="text-gray-800 dark:text-gray-200">{invoice.issue_date}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-1">Due Date</span>
                <span className="text-gray-800 dark:text-gray-200">{invoice.due_date}</span>
              </div>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th scope="col" className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                    {item.description}
                  </td>
                  <td className="py-4 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">
                    GHS {parseFloat(item.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white font-medium">GHS {parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.tax_amount) > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white font-medium">GHS {parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">GHS {parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-green-600 dark:text-green-400">Amount Paid</span>
              <span className="text-green-600 dark:text-green-400 font-medium">GHS {parseFloat(invoice.amount_paid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-red-600 dark:text-red-400">Remaining Balance</span>
              <span className="text-red-600 dark:text-red-400">
                GHS {(parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          <PaymentForm invoice={invoice} />
        </div>
      </div>
    </div>
  );
};

export default PublicInvoice;
