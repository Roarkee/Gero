import { useState } from "react";
import {
  Plus, Pencil, Trash2, X, Check, Building2,
  Smartphone, Link2, ChevronDown, Loader2, Shield
} from "lucide-react";
import {
  usePaymentProviders,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
} from "../hooks/usePayments";

const PROVIDER_TYPES = [
  { value: "mtn_momo",    label: "MTN Mobile Money",  icon: Smartphone },
  { value: "bank",        label: "Bank Transfer",      icon: Building2 },
  { value: "paystack",    label: "Paystack Link",      icon: Link2 },
  { value: "flutterwave", label: "Flutterwave",        icon: Link2 },
  { value: "stripe",      label: "Stripe",             icon: Link2 },
  { value: "paypal",      label: "PayPal",             icon: Link2 },
  { value: "hubtel",      label: "Hubtel",             icon: Smartphone },
  { value: "vodafone_cash", label: "Vodafone Cash",   icon: Smartphone },
];

const PROVIDER_COLORS = {
  mtn_momo:     { bg: "bg-yellow-50 dark:bg-yellow-900/20", icon: "text-yellow-600 dark:text-yellow-400", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  bank:         { bg: "bg-blue-50 dark:bg-blue-900/20",    icon: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  paystack:     { bg: "bg-teal-50 dark:bg-teal-900/20",   icon: "text-teal-600 dark:text-teal-400",   badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
  flutterwave:  { bg: "bg-orange-50 dark:bg-orange-900/20",icon: "text-orange-600 dark:text-orange-400",badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  stripe:       { bg: "bg-indigo-50 dark:bg-indigo-900/20",icon: "text-indigo-600 dark:text-indigo-400",badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
  paypal:       { bg: "bg-sky-50 dark:bg-sky-900/20",     icon: "text-sky-600 dark:text-sky-400",     badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" },
  hubtel:       { bg: "bg-rose-50 dark:bg-rose-900/20",   icon: "text-rose-600 dark:text-rose-400",   badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  vodafone_cash:{ bg: "bg-red-50 dark:bg-red-900/20",     icon: "text-red-600 dark:text-red-400",     badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
};

// Build the dynamic config fields for each provider type
const CONFIG_FIELDS = {
  mtn_momo:     [{ key: "phone_number", label: "Phone Number", placeholder: "+233 XX XXX XXXX" },
                 { key: "account_name", label: "Account Name", placeholder: "Full name on account" }],
  bank:         [{ key: "bank_name",      label: "Bank Name",       placeholder: "e.g. GCB Bank" },
                 { key: "account_number", label: "Account Number",  placeholder: "0012345678" },
                 { key: "account_name",   label: "Account Name",    placeholder: "Full name on account" }],
  paystack:     [{ key: "secret_key",  label: "Secret Key",    placeholder: "sk_live_..." }],
  flutterwave:  [{ key: "payment_link",  label: "Payment Link",    placeholder: "https://flutterwave.com/pay/..." }],
  stripe:       [{ key: "payment_link",  label: "Payment Link",    placeholder: "https://buy.stripe.com/..." }],
  paypal:       [{ key: "paypal_email",  label: "PayPal Email",    placeholder: "you@example.com" }],
  hubtel:       [{ key: "phone_number",  label: "Phone Number",    placeholder: "+233 XX XXX XXXX" },
                 { key: "account_name",  label: "Account Name",    placeholder: "Full name" }],
  vodafone_cash:[{ key: "phone_number",  label: "Phone Number",    placeholder: "+233 XX XXX XXXX" },
                 { key: "account_name",  label: "Account Name",    placeholder: "Full name" }],
};

function emptyConfig(providerType) {
  return (CONFIG_FIELDS[providerType] || []).reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});
}

function parseConfig(encrypted_config) {
  try { return JSON.parse(encrypted_config); } catch { return {}; }
}

// ── Provider Form Modal ───────────────────────────────────────────────────────
function ProviderFormModal({ provider, onClose }) {
  const isEdit = !!provider;
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();

  const [providerType, setProviderType] = useState(provider?.provider_type || "bank");
  const [displayName, setDisplayName]   = useState(provider?.display_name || "");
  const [isActive, setIsActive]         = useState(provider?.is_active ?? true);
  const [config, setConfig]             = useState(isEdit ? parseConfig(provider.encrypted_config) : emptyConfig("bank"));
  const [typeOpen, setTypeOpen]         = useState(false);

  const isPending = createProvider.isPending || updateProvider.isPending;

  const handleTypeChange = (val) => {
    setProviderType(val);
    setConfig(emptyConfig(val));
    setTypeOpen(false);
    if (!isEdit) {
      const found = PROVIDER_TYPES.find(p => p.value === val);
      setDisplayName(found?.label || "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      provider_type: providerType,
      display_name: displayName,
      is_active: isActive,
      encrypted_config: JSON.stringify(config),
    };
    const action = isEdit
      ? updateProvider.mutate({ id: provider.id, ...payload }, { onSuccess: onClose })
      : createProvider.mutate(payload, { onSuccess: onClose });
    return action;
  };

  const selectedType = PROVIDER_TYPES.find(p => p.value === providerType);
  const fields = CONFIG_FIELDS[providerType] || [];
  const colors = PROVIDER_COLORS[providerType] || PROVIDER_COLORS.bank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Edit Payment Method" : "Add Payment Method"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTypeOpen(!typeOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white hover:border-indigo-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {selectedType && <selectedType.icon className={`w-4 h-4 ${colors.icon}`} />}
                  <span>{selectedType?.label}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {typeOpen && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                  {PROVIDER_TYPES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleTypeChange(p.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${providerType === p.value ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      <p.icon className="w-4 h-4" />
                      {p.label}
                      {providerType === p.value && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. My MTN MoMo"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
            />
          </div>

          {/* Dynamic config fields */}
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{field.label}</label>
              <input
                type="text"
                required
                value={config[field.key] || ""}
                onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
              />
            </div>
          ))}

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Add Method"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Provider Card ─────────────────────────────────────────────────────────────
function ProviderCard({ provider, onEdit, onDelete }) {
  const colors = PROVIDER_COLORS[provider.provider_type] || PROVIDER_COLORS.bank;
  const typeInfo = PROVIDER_TYPES.find(p => p.value === provider.provider_type);
  const Icon = typeInfo?.icon || Building2;
  const config = parseConfig(provider.encrypted_config);

  return (
    <div className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex gap-4 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
      {/* Icon */}
      <div className={`h-10 w-10 min-w-[40px] rounded-xl ${colors.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{provider.display_name}</span>
          {!provider.is_active && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Inactive</span>
          )}
        </div>
        <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mb-2 ${colors.badge}`}>
          {typeInfo?.label}
        </span>
        <div className="space-y-0.5">
          {Object.entries(config).map(([k, v]) => (
            <p key={k} className="text-xs text-gray-500 dark:text-gray-400 truncate">
              <span className="capitalize">{k.replace(/_/g, " ")}: </span>
              <span className="text-gray-700 dark:text-gray-300">{v}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(provider)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(provider.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentSettings() {
  const { data: providers = [], isLoading } = usePaymentProviders();
  const deleteProvider = useDeleteProvider();
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);

  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (p) => { setEditTarget(p);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Add and manage the payment methods clients can use to pay you.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Method
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="mx-auto mb-4 h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No payment methods yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
            Add your first payment method so clients know how to pay you when you send an invoice.
          </p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              onEdit={openEdit}
              onDelete={(id) => deleteProvider.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProviderFormModal
          provider={editTarget}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
