import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { useInvoice, useInvoices } from "../hooks/useInvoices";
import { invoicesApi } from "../api/invoices.api";
import GenerateFromTimeModal from "../components/GenerateFromTimeModal";
import { usePaymentProviders } from "../../payments/hooks/usePayments";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  Clock,
  AlertCircle,
  CreditCard,
  Check
} from "lucide-react";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const { invoiceQuery } = useInvoice(id);
  const { updateInvoice } = useInvoices(); // To save changes
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, rate: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Local state for invoice, items, and selected payment method IDs
  const [localInvoice, setLocalInvoice] = useState(null);
  const [localItems, setLocalItems] = useState([]);
  const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState([]);

  // Fetch all user's payment providers for the selector
  const { data: availableProviders = [] } = usePaymentProviders();
  
  const invoice = invoiceQuery.data;

  // Sync local state when invoice data loads
  useEffect(() => {
    if (invoice) {
      setLocalInvoice({ ...invoice });
      setLocalItems(invoice.items || []);
      // Extract IDs from the nested payment_methods objects
      setSelectedPaymentMethodIds((invoice.payment_methods || []).map(pm => pm.id));
    }
  }, [invoice]);

  if (invoiceQuery.isLoading) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">Loading invoice...</div>;
  }

  if (!invoice || !localInvoice) {
    return <div className="p-12 text-center text-gray-500">Invoice not found.</div>;
  }

  const handleAddItem = () => {
    if (!newItem.description.trim() || newItem.rate < 0) return;
    const newId = `temp-${Date.now()}`;
    setLocalItems([...localItems, {
      ...newItem,
      id: newId,
      isTemp: true,
      amount: newItem.quantity * newItem.rate
    }]);
    setNewItem({ description: "", quantity: 1, rate: 0 });
  };

  const handleUpdateItem = (itemId, field, value) => {
    setLocalItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // Recalculate amount dynamically
        updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0);
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteItem = (itemId) => {
    setLocalItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleUpdateInvoiceField = (field, value) => {
    setLocalInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    const payloadItems = localItems.map(item => {
      // Only send the fields the backend ItemSerializer accepts
      const { description, quantity, rate } = item;
      const base = { description, quantity: parseFloat(quantity) || 0, rate: parseFloat(rate) || 0 };
      // Include id only for existing (non-temp) items so the backend can match them
      if (!item.isTemp && item.id) {
        base.id = item.id;
      }
      return base;
    });

    updateInvoice.mutate({
      id: parseInt(id),
      description: localInvoice.description,
      tax_rate: localInvoice.tax_rate,
      items: payloadItems,
      payment_method_ids: selectedPaymentMethodIds,
    });
  };

  const togglePaymentMethod = (pmId) => {
    setSelectedPaymentMethodIds(prev =>
      prev.includes(pmId) ? prev.filter(x => x !== pmId) : [...prev, pmId]
    );
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const blob = await invoicesApi.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoice_number || `Invoice_${id}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Local calculation of totals
  const localSubtotal = localItems.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)), 0);
  const localTaxRate = parseFloat(localInvoice.tax_rate) || 0;
  const localTax = localSubtotal * (localTaxRate / 100);
  const localTotal = localSubtotal + localTax;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/invoices/list" className="p-2 mr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {invoice.invoice_number || `Invoice #${invoice.id}`}
              </h2>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                invoice.status === 'overdue' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                invoice.status === 'sent' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Client: {invoice.client_name || `Client #${invoice.client}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Items */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Invoice Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Invoice Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Project</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.project_name || (invoice.project ? `Project #${invoice.project}` : 'No Project')}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <textarea
                  value={localInvoice.description || ""}
                  onChange={(e) => handleUpdateInvoiceField("description", e.target.value)}
                  className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 text-sm text-gray-900 dark:text-white transition-colors"
                  placeholder="Additional notes or description..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Line Items</h3>
              {invoice.project && (
                <button 
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  Generate from Time
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Qty</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Rate</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Amount</th>
                    <th scope="col" className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {localItems.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          value={item.description || ""}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          className="w-full text-right bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, 'rate', e.target.value)}
                          className="w-full text-right bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-0 px-0 py-1 text-sm text-gray-900 dark:text-white transition-colors"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Add New Row */}
                  <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        placeholder="Item description..."
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                        type="number" 
                        step="0.01"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        className="w-full text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input 
                        type="number" 
                        step="0.01"
                        value={newItem.rate}
                        onChange={(e) => setNewItem({...newItem, rate: e.target.value})}
                        className="w-full text-right bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                      {formatCurrency((parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.rate) || 0))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={handleAddItem}
                        disabled={!newItem.description.trim()}
                        className="p-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Financials */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(localSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  Tax 
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1">
                    <input 
                      type="number"
                      step="0.1"
                      className="w-12 text-right bg-transparent border-none p-0 text-sm focus:ring-0 text-gray-900 dark:text-white"
                      value={localInvoice.tax_rate || 0}
                      onChange={(e) => handleUpdateInvoiceField("tax_rate", e.target.value)}
                    />
                    <span>%</span>
                  </div>
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(localTax)}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(localTotal)}</span>
              </div>
            </div>

            {/* Payment Methods Selector */}
            {availableProviders.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  Payment Options
                </h4>
                <div className="space-y-2">
                  {availableProviders.map(pm => {
                    const isSelected = selectedPaymentMethodIds.includes(pm.id);
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => togglePaymentMethod(pm.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                            : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        }`}
                      >
                        <span className="font-medium truncate">{pm.display_name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Checked methods will appear on the invoice PDF.
                </p>
              </div>
            )}

            <div className="space-y-3">
               <button 
                 onClick={handleSaveChanges}
                 disabled={updateInvoice.isPending}
                 className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center"
               >
                 <Save className="w-4 h-4 mr-2" />
                 {updateInvoice.isPending ? "Saving..." : "Save Changes"}
               </button>
            </div>
            
            {invoice.status === 'overdue' && (
               <div className="mt-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-rose-800 dark:text-rose-300">Overdue Invoice</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                      This invoice is past its due date. Follow up with the client to secure payment.
                    </p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <GenerateFromTimeModal 
        invoiceId={id} 
        isOpen={isGenerateModalOpen} 
        onClose={() => setIsGenerateModalOpen(false)} 
      />
    </div>
  );
}
