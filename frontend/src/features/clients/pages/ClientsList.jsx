import React, { useState } from "react";
import { useClients } from "../hooks/useClients";
import { Link } from "react-router-dom";
import { Search, Filter, Plus } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { HealthIndicator } from "../components/HealthIndicator";
import { ClientModal } from "../components/ClientModal";

export default function ClientsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: clients, isLoading, error } = useClients();

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading clients...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading clients.</div>;
  }

  const filteredClients = clients?.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesHealth = healthFilter === "all" || c.health_label === healthFilter;
    const matchesPriority = priorityFilter === "all" || c.client_priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesHealth && matchesPriority;
  });

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center px-4 py-2 border rounded-lg text-sm font-medium ${showFilters ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="lead">Lead</option>
              <option value="inquiry">Inquiry</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="negotiating">Negotiating</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="waiting_on_client">Waiting On Client</option>
              <option value="revision">Revision</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="dormant">Dormant</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Health</label>
            <select 
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Health</option>
              <option value="healthy">Healthy</option>
              <option value="stable">Stable</option>
              <option value="at_risk">At Risk</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Priority</label>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setStatusFilter("all");
                setHealthFilter("all");
                setPriorityFilter("all");
              }}
              className="text-sm text-gray-500 hover:text-gray-900 mb-2"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients?.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <Link to={`/clients/${client.id}`} className="hover:text-emerald-600">{client.name}</Link>
                        </div>
                        <div className="text-sm text-gray-500">{client.company_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <HealthIndicator score={client.health_score} label={client.health_label} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="capitalize">{client.client_priority || 'Normal'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/clients/${client.id}`} className="text-emerald-600 hover:text-emerald-900">View</Link>
                  </td>
                </tr>
              ))}
              
              {filteredClients?.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No clients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
