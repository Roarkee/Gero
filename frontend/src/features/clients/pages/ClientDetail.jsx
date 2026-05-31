import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useClientDetail, useClientIntelligence, useClientActivities } from "../hooks/useClients";
import { StatusBadge } from "../components/StatusBadge";
import { HealthIndicator } from "../components/HealthIndicator";
import { TimelineItem } from "../components/TimelineItem";
import { ClientModal } from "../components/ClientModal";
import { 
  Building2, Mail, Phone, Globe, Calendar, ArrowLeft, 
  MessageSquare, Edit3, AlertCircle, TrendingUp
} from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";

export default function ClientDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: client, isLoading: loadingClient } = useClientDetail(id);
  const { data: intel, isLoading: loadingIntel } = useClientIntelligence(id);
  const { data: activities, isLoading: loadingActivities } = useClientActivities(id);

  if (loadingClient) {
    return <div className="p-8 text-gray-500">Loading workspace...</div>;
  }

  if (!client) {
    return <div className="p-8 text-red-500">Client not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <div className="mb-6">
        <Link to="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clients
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar - Identity */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">
                {client.name.charAt(0)}
              </div>
              <StatusBadge status={client.status} />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
            {client.company_name && (
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <Building2 className="w-4 h-4 mr-2" />
                {client.company_name}
              </div>
            )}
            
            <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
              {client.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="hover:text-emerald-600">{client.email}</a>
                </div>
              )}
              {client.phone_number && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  {client.phone_number}
                </div>
              )}
              {client.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe className="w-4 h-4 mr-3 text-gray-400" />
                  <a href={client.website} target="_blank" rel="noreferrer" className="hover:text-emerald-600">Website</a>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <HealthIndicator score={client.health_score} label={client.health_label} className="w-full justify-center" />
              {client.attention_required && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start border border-red-100">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                  Needs immediate attention
                </div>
              )}
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px" aria-label="Tabs">
                {["overview", "timeline", "notes", "projects"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? "border-emerald-500 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {client.note && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">About / Note</h3>
                      <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">{client.note}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Lifetime Value</div>
                      <div className="text-lg font-bold">${Number(client.lifetime_value).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Total Projects</div>
                      <div className="text-lg font-bold">{client.total_projects}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Next Follow-up</div>
                      <div className="text-sm font-medium">
                        {client.next_followup_at 
                          ? format(parseISO(client.next_followup_at), "MMM d, yyyy")
                          : "Not scheduled"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Last Contacted</div>
                      <div className="text-sm font-medium">
                        {client.last_contacted_at 
                          ? formatDistanceToNow(parseISO(client.last_contacted_at), { addSuffix: true })
                          : "Never"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
                    <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Add Log</button>
                  </div>
                  
                  {loadingActivities ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded"></div>)}
                    </div>
                  ) : activities?.length > 0 ? (
                    <ul role="list" className="-mb-8">
                      {activities.map((activity, activityIdx) => (
                        <TimelineItem 
                          key={activity.id} 
                          activity={activity} 
                          isLast={activityIdx === activities.length - 1} 
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">No activities recorded yet.</p>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Notes module coming soon.</p>
                </div>
              )}

              {activeTab === "projects" && (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Projects integration coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Intelligence
            </h3>

            {loadingIntel ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Segments</div>
                  <div className="flex flex-wrap gap-2">
                    {intel?.segments?.map(seg => (
                      <span key={seg} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md capitalize border border-gray-200">
                        {seg.replace('_', ' ')}
                      </span>
                    ))}
                    {!intel?.segments?.length && <span className="text-sm text-gray-400 italic">None</span>}
                  </div>
                </div>

                {intel?.attention?.requires_attention && (
                  <div>
                    <div className="text-xs text-red-500 mb-1 uppercase tracking-wider font-medium">Why attention is needed</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {intel.attention.reasons.map((r, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Days in Status</div>
                  <div className="text-sm font-medium text-gray-900">{intel?.days_in_status} days</div>
                </div>

                <div>
                   <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Days Since Contact</div>
                  <div className="text-sm font-medium text-gray-900">{intel?.days_since_contact ?? 'N/A'} days</div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      <ClientModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        client={client}
      />
    </div>
  );
}
