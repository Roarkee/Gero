import React from "react";
import { useInvoiceIntelligence } from "../hooks/useInvoiceIntelligence";
import { DollarSign, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from "date-fns";

const formatCurrency = (value) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
};

export default function CashFlowDashboard() {
  const { cashFlowData, isLoading } = useInvoiceIntelligence();

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading cash flow analysis...</div>;
  }

  const { buckets = {}, upcomingInvoices = [] } = cashFlowData || {};

  const barData = Object.keys(buckets).map(key => ({
    name: key,
    amount: buckets[key],
  }));

  const totalOutstanding = Object.values(buckets).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Cash Flow & Receivables
            <DollarSign className="w-6 h-6 ml-3 text-indigo-500" />
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Forecast your upcoming revenue and monitor overdue accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Receivables Aging Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Receivables Aging</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Outstanding amounts grouped by days overdue</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Outstanding</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="h-80 w-full mt-4">
              {totalOutstanding === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <AlertCircle className="w-10 h-10 mb-3 text-gray-400" />
                  <p>No outstanding receivables.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#f97316' : index === 2 ? '#ef4444' : '#b91c1c'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Due Invoices List */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                Upcoming Due
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {upcomingInvoices.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  No upcoming invoices due.
                </div>
              ) : (
                upcomingInvoices.map(inv => (
                  <div key={inv.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {inv.client_name || `Client #${inv.client}`}
                      </p>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ${parseFloat(inv.total_amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {inv.invoice_number || `INV-${inv.id}`}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                        Due {format(new Date(inv.due_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
