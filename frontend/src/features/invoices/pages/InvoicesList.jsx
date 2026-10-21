import React, { useState, useMemo } from "react";
import { useInvoices } from "../hooks/useInvoices";
import InvoiceTable from "../components/InvoiceTable";
import InvoiceKanban from "../components/InvoiceKanban";
import CreateInvoiceModal from "../components/CreateInvoiceModal";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutList, 
  Kanban, 
  X, 
  RotateCcw,
  DollarSign
} from "lucide-react";
import { isThisMonth, isBefore, addDays, startOfDay, endOfDay } from "date-fns";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount || 0);
};

export default function InvoicesList() {
  const { invoicesQuery, updateInvoice } = useInvoices();
  const rawData = invoicesQuery.data;
  // Ensure we get the full list regardless of pagination wrapper or raw array
  const invoices = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.results)) return rawData.results;
    return [];
  }, [rawData]);

  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Extract unique clients for client filter dropdown
  const uniqueClients = useMemo(() => {
    const clientsMap = new Map();
    invoices.forEach((inv) => {
      const name = inv.client_name || (typeof inv.client === "object" ? inv.client?.name : null);
      const id = inv.client ? (typeof inv.client === "object" ? inv.client?.id : inv.client) : null;
      if (name && id && !clientsMap.has(String(id))) {
        clientsMap.set(String(id), name);
      }
    });
    return Array.from(clientsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [invoices]);

  // Status counts for quick pill tabs
  const statusCounts = useMemo(() => {
    const counts = {
      all: invoices.length,
      draft: 0,
      sent: 0,
      partly_paid: 0,
      overdue: 0,
      paid: 0,
      cancelled: 0,
    };
    invoices.forEach((inv) => {
      if (counts[inv.status] !== undefined) {
        counts[inv.status] += 1;
      }
    });
    return counts;
  }, [invoices]);

  // Check if any non-default filter is active
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count += 1;
    if (clientFilter !== "all") count += 1;
    if (dateFilter !== "all") count += 1;
    if (search.trim() !== "") count += 1;
    return count;
  }, [statusFilter, clientFilter, dateFilter, search]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setDateFilter("all");
    setSortBy("newest");
  };

  const handleUpdateStatus = (id, newStatus) => {
    updateInvoice.mutate({ id, status: newStatus });
  };

  // Filter & Sort Invoices
  const filteredInvoices = useMemo(() => {
    const today = startOfDay(new Date());

    return invoices
      .filter((inv) => {
        // 1. Search Filter
        if (search.trim()) {
          const term = search.toLowerCase();
          const idMatch = String(inv.id).toLowerCase().includes(term);
          const numMatch = inv.invoice_number?.toLowerCase().includes(term);
          const titleMatch = inv.title?.toLowerCase().includes(term);
          const clientName = inv.client_name || (typeof inv.client === "object" ? inv.client?.name : "");
          const clientMatch = clientName.toLowerCase().includes(term);
          const projMatch = inv.project_name?.toLowerCase().includes(term);

          if (!idMatch && !numMatch && !titleMatch && !clientMatch && !projMatch) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== "all" && inv.status !== statusFilter) {
          return false;
        }

        // 3. Client Filter
        if (clientFilter !== "all") {
          const invClientId = typeof inv.client === "object" ? String(inv.client?.id) : String(inv.client || "");
          if (invClientId !== clientFilter) {
            return false;
          }
        }

        // 4. Date Range Filter
        if (dateFilter !== "all") {
          const dueDate = inv.due_date ? new Date(inv.due_date) : null;
          const issueDate = inv.issue_date ? new Date(inv.issue_date) : null;

          if (dateFilter === "overdue") {
            if (inv.status !== "overdue" && (!dueDate || !isBefore(dueDate, today))) {
              return false;
            }
          } else if (dateFilter === "due_week") {
            if (!dueDate) return false;
            const weekFromNow = addDays(today, 7);
            if (isBefore(dueDate, today) || isBefore(weekFromNow, dueDate)) {
              return false;
            }
          } else if (dateFilter === "due_month") {
            if (!dueDate || !isThisMonth(dueDate)) return false;
          } else if (dateFilter === "issued_month") {
            if (!issueDate || !isThisMonth(issueDate)) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 5. Sorting
        if (sortBy === "newest") {
          const dateA = new Date(a.issue_date || a.created_at || 0);
          const dateB = new Date(b.issue_date || b.created_at || 0);
          return dateB - dateA;
        }
        if (sortBy === "oldest") {
          const dateA = new Date(a.issue_date || a.created_at || 0);
          const dateB = new Date(b.issue_date || b.created_at || 0);
          return dateA - dateB;
        }
        if (sortBy === "due_asc") {
          const dateA = new Date(a.due_date || "9999-12-31");
          const dateB = new Date(b.due_date || "9999-12-31");
          return dateA - dateB;
        }
        if (sortBy === "amount_desc") {
          return parseFloat(b.total_amount || 0) - parseFloat(a.total_amount || 0);
        }
        if (sortBy === "amount_asc") {
          return parseFloat(a.total_amount || 0) - parseFloat(b.total_amount || 0);
        }
        if (sortBy === "number") {
          return (a.invoice_number || "").localeCompare(b.invoice_number || "");
        }
        return 0;
      });
  }, [invoices, search, statusFilter, clientFilter, dateFilter, sortBy]);

  // Filtered total amount
  const filteredTotalValue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  }, [filteredInvoices]);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Manage your billing, receivables, and payment statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: "All" },
          { id: "draft", label: "Draft" },
          { id: "sent", label: "Sent" },
          { id: "partly_paid", label: "Partly Paid" },
          { id: "overdue", label: "Overdue" },
          { id: "paid", label: "Paid" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          const count = statusCounts[tab.id] ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-2 px-1.5 py-0.2 rounded-full text-[11px] ${
                isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Controls Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, Invoice #, Client or Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFiltersCount > 0
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Filter className="w-4 h-4 mr-2 text-current" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* View Mode (Table / Kanban Board) */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-900 rounded-xl self-end sm:self-auto">
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

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* 1. Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Statuses ({invoices.length})</option>
              <option value="draft">Draft ({statusCounts.draft})</option>
              <option value="sent">Sent ({statusCounts.sent})</option>
              <option value="partly_paid">Partly Paid ({statusCounts.partly_paid})</option>
              <option value="overdue">Overdue ({statusCounts.overdue})</option>
              <option value="paid">Paid ({statusCounts.paid})</option>
              <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
            </select>
          </div>

          {/* 2. Client Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Client
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Due Date / Timeline */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Timeline / Due Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue Invoices</option>
              <option value="due_week">Due within 7 days</option>
              <option value="due_month">Due this month</option>
              <option value="issued_month">Issued this month</option>
            </select>
          </div>

          {/* 4. Sort Order */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="newest">Issue Date: Newest First</option>
              <option value="oldest">Issue Date: Oldest First</option>
              <option value="due_asc">Due Date: Soonest First</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
              <option value="number">Invoice Number (A-Z)</option>
            </select>
          </div>

        </div>
      )}

      {/* Result Metrics Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
        <div>
          Showing <span className="font-bold text-gray-900 dark:text-white">{filteredInvoices.length}</span> of{" "}
          <span className="font-bold text-gray-900 dark:text-white">{invoices.length}</span> total invoices
          {activeFiltersCount > 0 && (
            <span className="ml-2 text-indigo-600 dark:text-indigo-400">
              (Filtered)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200">
          <span>Total Filtered:</span>
          <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(filteredTotalValue)}</span>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === "table" ? (
        <InvoiceTable 
          invoices={filteredInvoices} 
          isLoading={invoicesQuery.isLoading} 
          onResetFilters={handleResetFilters}
        />
      ) : (
        <InvoiceKanban 
          invoices={filteredInvoices} 
          isLoading={invoicesQuery.isLoading} 
          onUpdateStatus={handleUpdateStatus} 
        />
      )}

      {/* Modal */}
      <CreateInvoiceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
