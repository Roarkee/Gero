import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  useClientDetail, 
  useClientIntelligence, 
  useClientActivities,
  useUpdateClient,
  useCreateClientActivity,
  useInviteClient,
  useDismissAttention
} from "../hooks/useClients";
import { StatusBadge } from "../components/StatusBadge";
import { HealthIndicator } from "../components/HealthIndicator";
import { TimelineItem } from "../components/TimelineItem";
import { ClientModal } from "../components/ClientModal";
import { 
  Building2, Mail, Phone, Globe, Calendar, ArrowLeft, 
  MessageSquare, Edit3, AlertCircle, TrendingUp, Check, X, FileText, FolderOpen, UserPlus
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow, parseISO, format } from "date-fns";

export default function ClientDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "call", description: "" });

  const { data: client, isLoading: loadingClient } = useClientDetail(id);
  const { data: intel, isLoading: loadingIntel } = useClientIntelligence(id);
  const { data: activities, isLoading: loadingActivities } = useClientActivities(id);
  
  const updateClientMutation = useUpdateClient();
  const createActivityMutation = useCreateClientActivity();
  const inviteClientMutation = useInviteClient();
  const dismissAttentionMutation = useDismissAttention();

  const handleDismissAttention = () => {
    dismissAttentionMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Attention required cleared");
      }
    });
  };

  const handleSaveNote = () => {
    updateClientMutation.mutate({ id, note: noteContent }, {
      onSuccess: () => setIsEditingNote(false)
    });
  };

  const handleSaveActivity = (e) => {
    e.preventDefault();
    if (!activityForm.description.trim()) return;
    createActivityMutation.mutate({ 
      id, 
      activity_type: activityForm.type, 
      description: activityForm.description 
    }, {
      onSuccess: () => {
        setShowActivityForm(false);
        setActivityForm({ type: "call", description: "" });
      }
    });
  };

  React.useEffect(() => {
    if (client && !isEditingNote) {
      setNoteContent(client.note || "");
    }
  }, [client, isEditingNote]);

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
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex flex-col items-start border border-red-100">
                  <div className="flex items-center w-full">
                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                    Needs immediate attention
                  </div>
                  <button
                    onClick={handleDismissAttention}
                    disabled={dismissAttentionMutation.isPending}
                    className="mt-2 w-full text-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-xs font-medium transition-colors"
                  >
                    {dismissAttentionMutation.isPending ? "Resolving..." : "Dismiss"}
                  </button>
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
              
              {client.portal_invite_status === "accepted" ? (
                <div className="w-full flex items-center justify-center px-4 py-2 border border-emerald-200 shadow-sm text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 mt-3">
                  <Check className="w-4 h-4 mr-2" />
                  Portal Access Active
                </div>
              ) : client.portal_invite_status === "pending" || client.portal_invite_status === "expired" ? (
                <button 
                  onClick={() => {
                    inviteClientMutation.mutate(id, {
                      onSuccess: (res) => toast.success(res.detail || "Invitation resent successfully!"),
                      onError: () => toast.error("Failed to resend invitation.")
                    });
                  }}
                  disabled={inviteClientMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 mt-3 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {inviteClientMutation.isPending ? "Sending..." : "Resend Invitation"}
                </button>
              ) : (
                <button 
                  onClick={() => {
                    inviteClientMutation.mutate(id, {
                      onSuccess: (res) => toast.success(res.detail || "Invitation sent successfully!"),
                      onError: () => toast.error("Failed to send invitation.")
                    });
                  }}
                  disabled={inviteClientMutation.isPending}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 mt-3 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {inviteClientMutation.isPending ? "Sending..." : "Invite to Portal"}
                </button>
              )}
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
                      <div className="text-lg font-bold">GH₵ {Number(client.lifetime_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                    <button 
                      onClick={() => setShowActivityForm(!showActivityForm)}
                      className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      {showActivityForm ? "Cancel Log" : "Add Log"}
                    </button>
                  </div>
                  
                  {showActivityForm && (
                    <form onSubmit={handleSaveActivity} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                        <select 
                          className="text-sm border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={activityForm.type}
                          onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                        >
                          <option value="call">Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Note (Audit only)</option>
                        </select>
                        <input 
                          type="text" 
                          required
                          placeholder="Briefly describe the interaction..." 
                          className="flex-1 text-sm border border-gray-300 rounded-md p-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={activityForm.description}
                          onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="submit" 
                          disabled={createActivityMutation.isPending}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {createActivityMutation.isPending ? "Saving..." : "Save Log"}
                        </button>
                      </div>
                    </form>
                  )}

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
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Client Profile Note</h3>
                    {!isEditingNote && (
                      <button 
                        onClick={() => setIsEditingNote(true)}
                        className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                      >
                        Edit Note
                      </button>
                    )}
                  </div>
                  
                  {isEditingNote ? (
                    <div className="space-y-4">
                      <textarea 
                        className="w-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 text-sm"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write comprehensive notes about this client, their preferences, and important context here..."
                      />
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleSaveNote}
                          disabled={updateClientMutation.isPending}
                          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {updateClientMutation.isPending ? "Saving..." : "Save Note"}
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingNote(false);
                            setNoteContent(client.note || "");
                          }}
                          className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[200px] whitespace-pre-wrap text-sm text-gray-800">
                      {client.note ? client.note : <span className="text-gray-400 italic">No notes have been added for this client yet. Click Edit Note to add context.</span>}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "projects" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Associated Projects</h3>
                  {client.projects && client.projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.projects.map(project => (
                        <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{project.name}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status?.replace('_', ' ')}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
                          )}
                          <Link 
                            to={`/projects/${project.id}`} 
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center"
                          >
                            <FolderOpen className="w-4 h-4 mr-1" /> View Project
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No projects associated with this client.</p>
                    </div>
                  )}
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
