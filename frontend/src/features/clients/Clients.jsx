import { useClients } from "../../api/queries/useClients";
import {
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "../../components/ui";
import { format } from "date-fns";
import { DollarSign, AlertCircle, Briefcase, RefreshCw } from "lucide-react";
import CreateClientModal from "./CreateClientModal";
import { useState } from "react";

export default function Clients() {
  const { data: clients, isLoading, refetch, isRefetching } = useClients();
  const [isModalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const globalRevenue = clients?.reduce((acc, c) => acc + parseFloat(c.total_revenue || 0), 0) || 0;
  const globalUnpaid = clients?.reduce((acc, c) => acc + parseFloat(c.unpaid_invoices_total || 0), 0) || 0;
  const globalActiveProjects = clients?.reduce((acc, c) => acc + parseInt(c.active_projects_count || 0, 10), 0) || 0;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Clients
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your client relationships and details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none shadow-sm w-64"
            />
          </div>
          <Button
            variant="outline"
            size="md"
            className="rounded-xl bg-white"
            onClick={() => refetch()}
            isLoading={isRefetching}
            title="Refresh clients"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="md"
            className="shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all rounded-xl"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>
      </div>

      {/* Dashboard Overview */}
      {clients && clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${globalRevenue.toFixed(2)}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Projects</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{globalActiveProjects}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Unpaid Invoices</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${globalUnpaid.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {clients && clients.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="mx-auto h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No clients yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Add your first client to start tracking projects and invoices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients?.map((client) => (
            <div
              key={client.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl shadow-inner">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                {client.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                {client.company_name || "No Company"}
              </p>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone_number && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{client.phone_number}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Revenue</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(client.total_revenue || 0).toFixed(0)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Unpaid</p>
                  <p className="text-sm font-bold text-rose-500 dark:text-rose-400">
                    ${parseFloat(client.unpaid_invoices_total || 0).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                <span>
                  Added {format(new Date(client.created_at), "MMM d, yyyy")}
                </span>
                <span
                  className={`px-2 py-1 rounded-md capitalize ${client.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-50 text-gray-600"
                    }`}
                >
                  {client.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateClientModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
