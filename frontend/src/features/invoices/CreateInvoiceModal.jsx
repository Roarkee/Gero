import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCreateInvoice, useGenerateInvoiceFromTime } from "../../api/queries/useInvoices";
import { useClients } from "../../api/queries/useClients";
import { useProjects } from "../../api/queries/useProjects";
import { Button, Input } from "../../components/ui";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateInvoiceModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        client: "",
        project: "",
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        title: "",
        description: ""
    });
    const [autoGenerate, setAutoGenerate] = useState(true);

    const { data: clients } = useClients();
    const { data: projects } = useProjects();
    const { mutateAsync: createInvoice, isPending: creating } = useCreateInvoice();
    const { mutateAsync: generateFromTime, isPending: generating } = useGenerateInvoiceFromTime();

    const isPending = creating || generating;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client) return toast.error("Client is required");

        try {
            const newInvoice = await createInvoice(formData);

            if (autoGenerate && formData.project) {
                await generateFromTime(newInvoice.id);
                toast.success("Invoice created and time entries synced!");
            } else {
                toast.success("Invoice created successfully!");
            }

            setFormData({
                client: "",
                project: "",
                issue_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                title: "",
                description: ""
            });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create invoice");
        }
    };

    const filteredProjects = projects?.filter(p => p.client === parseInt(formData.client)) || [];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                                        Create Invoice
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Invoice Title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Website Redesign - Phase 1"
                                    />

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Client
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.client}
                                            onChange={(e) => setFormData({ ...formData, client: e.target.value, project: "" })}
                                            required
                                        >
                                            <option value="">Select Client...</option>
                                            {clients?.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.company_name ? `${c.name} (${c.company_name})` : c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Project (Optional)
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.project}
                                            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                            disabled={!formData.client}
                                        >
                                            <option value="">No Project Attached</option>
                                            {filteredProjects.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Issue Date"
                                            type="date"
                                            value={formData.issue_date}
                                            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Due Date"
                                            type="date"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {formData.project && (
                                        <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 mt-2">
                                            <input
                                                type="checkbox"
                                                id="autoGenerate"
                                                checked={autoGenerate}
                                                onChange={(e) => setAutoGenerate(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            <label htmlFor="autoGenerate" className="text-sm font-medium text-indigo-900 dark:text-indigo-200 cursor-pointer">
                                                Auto-generate items from unbilled time entries
                                            </label>
                                        </div>
                                    )}

                                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button variant="ghost" onClick={onClose} type="button">
                                            Cancel
                                        </Button>
                                        <Button variant="primary" type="submit" isLoading={isPending} disabled={!formData.client}>
                                            Create
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
