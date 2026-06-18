import React, { useState } from "react";
import { useInvoices } from "../hooks/useInvoices";
import InvoiceTable from "../components/InvoiceTable";
import InvoiceKanban from "../components/InvoiceKanban";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import { Plus, Search, Filter, LayoutList, Kanban } from "lucide-react";
import { Link } from "react-router-dom";

export default function InvoicesList() {
  const { invoicesQuery, updateInvoice } = useInvoices();
  const rawData = invoicesQuery.data;
  const invoices = rawData?.results || rawData || [];
  
  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleUpdateStatus = (id, newStatus) => {
    updateInvoice.mutate({ id, status: newStatus });
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = search.toLowerCase();
    const idMatch = String(inv.id).toLowerCase().includes(term);
    const numMatch = inv.invoice_number?.toLowerCase().includes(term);
    const clientMatch = typeof inv.client === 'object' 
      ? inv.client?.name?.toLowerCase().includes(term) 
      : String(inv.client).toLowerCase().includes(term);
    return idMatch || numMatch || clientMatch;
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your billing and receivables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, Number or Client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <LayoutList className="w-4 h-4 mr-2" />
            Table
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "kanban"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Kanban className="w-4 h-4 mr-2" />
            Board
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <InvoiceTable invoices={filteredInvoices} isLoading={invoicesQuery.isLoading} />
      ) : (
        <InvoiceKanban invoices={filteredInvoices} isLoading={invoicesQuery.isLoading} onUpdateStatus={handleUpdateStatus} />
      )}

      <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}
