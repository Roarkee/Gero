import { FileText } from "lucide-react";

export default function Invoices() {
  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Invoices
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track payments and billable hours
          </p>
        </div>
      </div>

      <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
        <div className="mx-auto h-20 w-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="h-10 w-10 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Coming Soon
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Invoicing features are currently under development. You'll be able to
          generate PDF invoices from your tasks and time entries.
        </p>
      </div>
    </div>
  );
}
