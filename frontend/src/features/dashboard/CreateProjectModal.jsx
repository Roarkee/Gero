import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCreateProject } from "../../api/queries/useProjects";
import { useClients, useCreateClient } from "../../api/queries/useClients";
import { Button, Input } from "../../components/ui";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function CreateProjectModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client: "",
  });

  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    company_name: "",
  });

  const { mutateAsync: createProject, isPending } = useCreateProject();
  const { data: clients, isLoading: loadingClients } = useClients();
  const { mutateAsync: createClient, isPending: creatingClient } =
    useCreateClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Project name is required");
    if (!formData.client) return toast.error("Please select a client");

    try {
      await createProject(formData);
      toast.success("Project created successfully!");
      setFormData({ name: "", description: "", client: "" });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project");
    }
  };

  const handleCreateClient = async () => {
    if (!clientData.name) return toast.error("Client name is required");
    if (!clientData.email) return toast.error("Client email is required");

    try {
      const newClient = await createClient(clientData);
      toast.success("Client created!");
      setFormData({ ...formData, client: newClient.id }); // Auto-select
      setIsCreatingClient(false);
      setClientData({ name: "", email: "", company_name: "" });
    } catch (error) {
      toast.error("Failed to create client");
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
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900 dark:text-white"
                  >
                    Create New Project
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Project Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Website Redesign"
                  />

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Client
                      </label>
                      {!isCreatingClient && (
                        <button
                          type="button"
                          onClick={() => setIsCreatingClient(true)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          New Client
                        </button>
                      )}
                    </div>

                    {isCreatingClient ? (
                      <div className="space-y-3 animate-slide-down">
                        <Input
                          placeholder="Client Name"
                          value={clientData.name}
                          onChange={(e) =>
                            setClientData({
                              ...clientData,
                              name: e.target.value,
                            })
                          }
                          className="bg-white"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={clientData.email}
                          onChange={(e) =>
                            setClientData({
                              ...clientData,
                              email: e.target.value,
                            })
                          }
                          className="bg-white"
                        />
                        <div className="flex gap-2 justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreatingClient(false)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateClient}
                            isLoading={creatingClient}
                            className="text-xs"
                          >
                            Save Client
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                          disabled={loadingClients}
                        >
                          <option value="">Select a client...</option>
                          {clients?.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.company_name
                                ? `${client.name} (${client.company_name})`
                                : client.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {!isCreatingClient && clients?.length === 0 && (
                      <p className="text-xs text-orange-500 mt-2">
                        You need to add a client before creating a project.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Description{" "}
                      <span className="text-gray-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description..."
                    />
                  </div>

                  <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="ghost" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={isPending}
                      disabled={!formData.client || isCreatingClient}
                    >
                      Create Project
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
