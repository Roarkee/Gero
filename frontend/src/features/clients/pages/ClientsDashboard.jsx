import React from "react";
import { useDashboardIntelligence } from "../hooks/useClients";
import { Users, AlertTriangle, Clock, Activity, DollarSign } from "lucide-react";
import { TimelineItem } from "../components/TimelineItem";
import { ClientCard } from "../components/ClientCard";

export default function ClientsDashboard() {
  const { data, isLoading, error } = useDashboardIntelligence();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading dashboard data.</div>;
  }

  const { stats, pipeline, attention_items, revenue } = data || {};

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-sm font-medium">Total Clients</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.total_clients || 0}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-sm font-medium">Active Clients</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.active_clients || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm bg-red-50/30">
          <div className="flex justify-between items-center text-red-600 mb-2">
            <span className="text-sm font-medium">Needs Attention</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-red-700">{attention_items?.length || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-sm font-medium">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${revenue?.total_revenue?.toLocaleString() || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Needs Attention Column */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> 
              Attention Required
            </h2>
            {attention_items?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attention_items.map((item) => (
                  <div key={item.id} className="bg-white border border-red-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                    <h3 className="font-semibold text-sm mb-2">{item.name}</h3>
                    <ul className="text-xs text-red-600 space-y-1">
                      {item.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                All clear! No clients need immediate attention.
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Summary</h2>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
               {pipeline?.map(p => (
                 <div key={p.status} className="px-4 py-2 bg-gray-50 rounded-lg flex-1 min-w-[120px]">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{p.status.replace('_', ' ')}</div>
                    <div className="text-xl font-bold">{p.total}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Top Clients */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-emerald-500" />
              Top Clients
            </h2>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
              {revenue?.top_clients?.map((c, i) => (
                <div key={c.client_id || c.id || i} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium">{c.client__name || c.name}</span>
                  </div>
                  <span className="text-sm font-semibold">GH₵{Number(c.total || c.lifetime_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
