import React from "react";
import { useDashboardIntelligence } from "../hooks/useClients";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AttentionCenter() {
  const { data, isLoading, error } = useDashboardIntelligence();

  if (isLoading) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading Attention Center...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading data.</div>;
  }

  const { attention_items } = data || {};

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3 text-amber-500" />
          Attention Center
        </h1>
        <p className="text-gray-500 mt-2">
          An operational queue of clients needing your immediate focus today.
        </p>
      </div>

      {attention_items?.length > 0 ? (
        <div className="space-y-4">
          {attention_items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border-l-4 border-l-red-500 border-y border-r border-gray-200 rounded-r-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {item.reasons.map((reason, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              
              <Link 
                to={`/clients/${item.id}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shrink-0"
              >
                Resolve
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Inbox Zero!</h3>
          <p className="text-gray-600">You're completely caught up. No clients require your immediate attention.</p>
        </div>
      )}
    </div>
  );
}
