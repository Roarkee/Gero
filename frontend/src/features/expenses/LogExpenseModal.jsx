import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCreateExpense, useExpenseCategories } from "../../api/queries/useExpenses";
import { useProjects } from "../../api/queries/useProjects";
import { Button, Input } from "../../components/ui";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function LogExpenseModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "",
        project: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
    });

    const { data: categories } = useExpenseCategories();
    const { data: projects } = useProjects();
    const { mutateAsync: createExpense, isPending } = useCreateExpense();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category || !formData.amount || !formData.title) {
            return toast.error("Title, category, and amount are required");
        }

        try {
            await createExpense(formData);
            toast.success("Expense logged successfully!");
            setFormData({
                title: "",
                amount: "",
                category: "",
                project: "",
                date: new Date().toISOString().split('T')[0],
                description: ""
            });
            onClose();
        } catch (error) {
            toast.error("Failed to log expense");
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
                                        Log Expense
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Title / Merchant"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g. AWS Hosting"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                Category
                                            </label>
                                            <select
                                                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Category...</option>
                                                {categories?.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <Input
                                            label="Amount ($)"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Project (Optional)
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={formData.project}
                                            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                        >
                                            <option value="">No Project Attached</option>
                                            {projects?.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Input
                                            label="Date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                                        <Button variant="primary" type="submit" isLoading={isPending} disabled={!formData.category || !formData.amount}>
                                            Log Expense
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
