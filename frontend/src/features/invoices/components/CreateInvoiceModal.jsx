import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useClients } from "../../clients/hooks/useClients";
import { useProjects } from "../../projects/hooks/useProjects";
import { useInvoices } from "../hooks/useInvoices";
import { Button, Input } from "../../../components/ui";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function CreateInvoiceModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client: "",
    project: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    tax_rate: "0.00",
    status: "draft",
  });

  const { data: clientsRaw, isLoading: loadingClients } = useClients();
  const clients = clientsRaw?.results || clientsRaw || [];

  const { projectsQuery } = useProjects();
  const projects = projectsQuery?.data || [];

  const { createInvoice } = useInvoices();

  // Filter projects by selected client
  const filteredProjects = projects.filter(
    (p) => String(p.client) === String(formData.client)
  );

  // If selected client changes, reset project if it doesn't belong to the new client
  useEffect(() => {
    if (formData.project) {
      const projectBelongs = filteredProjects.some(
        (p) => String(p.id) === String(formData.project)
      );
      if (!projectBelongs) {
        setFormData((prev) => ({ ...prev, project: "" }));
      }
    }
  }, [formData.client, filteredProjects, formData.project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Invoice title is required");
    if (!formData.client) return toast.error("Please select a client");
    if (!formData.issue_date) return toast.error("Issue date is required");
    if (!formData.due_date) return toast.error("Due date is required");
    if (new Date(formData.due_date) < new Date(formData.issue_date)) {
      return toast.error("Due date cannot be before issue date");
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      client: parseInt(formData.client),
      project: formData.project ? parseInt(formData.project) : null,
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      status: formData.status,
    };

    try {
      const newInvoice = await createInvoice.mutateAsync(payload);
      toast.success("Invoice created successfully!");
      onClose();
      // Navigate to the details page of the newly created invoice
      navigate(`/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create invoice");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <DialogTitle
                as="h3"
                className="text-xl font-bold leading-6 text-gray-900 dark:text-white"
              >
                Create New Invoice
              </DialogTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Invoice Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Website Development - Phase 1"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none text-sm"
                      value={formData.client}
                      onChange={(e) =>
                        setFormData({ ...formData, client: e.target.value })
                      }
                      disabled={loadingClients}
                      required
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company_name
                            ? `${client.name} (${client.company_name})`
                            : client.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Project (Optional)
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none text-sm disabled:opacity-50"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData({ ...formData, project: e.target.value })
                      }
                      disabled={!formData.client || projectsQuery.isLoading}
                    >
                      <option value="">
                        {!formData.client
                          ? "Select a client first..."
                          : "No Project / General"}
                      </option>
                      {filteredProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Issue Date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_date: e.target.value })
                  }
                  required
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none text-sm"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm shadow-sm"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Notes shown on invoice..."
                />
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="ghost" onClick={onClose} type="button">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createInvoice.isPending}
                >
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
