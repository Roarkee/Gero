import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCreateClient } from "../../api/queries/useClients";
import { Button, Input } from "../../components/ui";
import { X, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateClientModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
        billing_currency: "USD",
        billing_address: "",
        default_hourly_rate: ""
    });

    const { mutateAsync: createClient, isPending } = useCreateClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error("Client name is required");

        try {
            const payload = { ...formData };
            if (!payload.default_hourly_rate) delete payload.default_hourly_rate;

            await createClient(payload);
            toast.success("Client added successfully!");
            setFormData({
                name: "",
                email: "",
                phone_number: "",
                company_name: "",
                billing_currency: "USD",
                billing_address: "",
                default_hourly_rate: ""
            });
            onClose();
        } catch (error) {
            toast.error("Failed to add client");
        }
    };

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

                <div className="fixed inset-0 overflow-y-auto w-full">
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900 dark:text-white">
                                            New Client
                                        </Dialog.Title>
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Client Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                        />
                                        <Input
                                            label="Company Name"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                            placeholder="Acme Corp (Optional)"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                        <Input
                                            label="Phone Number"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Default Hourly Rate ($)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.default_hourly_rate}
                                            onChange={(e) => setFormData({ ...formData, default_hourly_rate: e.target.value })}
                                            placeholder="e.g. 50.00"
                                        />
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Billing Currency
                                            </label>
                                            <select
                                                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                value={formData.billing_currency}
                                                onChange={(e) => setFormData({ ...formData, billing_currency: e.target.value })}
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Address
                                        </label>
                                        <textarea
                                            rows={2}
                                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none"
                                            value={formData.billing_address}
                                            onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                                            placeholder="Full billing address..."
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                                        <Button variant="primary" type="submit" isLoading={isPending} disabled={!formData.name}>
                                            Create Client
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
