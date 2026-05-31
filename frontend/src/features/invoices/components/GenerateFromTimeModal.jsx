import React, { useState } from "react";
import { X, Clock, PlayCircle } from "lucide-react";
import { useInvoice } from "../hooks/useInvoices";
import toast from "react-hot-toast";

export default function GenerateFromTimeModal({ invoiceId, isOpen, onClose }) {
  const { generateFromTime } = useInvoice(invoiceId);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    generateFromTime.mutate(null, {
      onSuccess: (res) => {
        toast.success(res.message || "Time entries imported successfully");
        setIsGenerating(false);
        onClose();
      },
      onError: () => {
        toast.error("Failed to generate from time entries");
        setIsGenerating(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" />
            Import Time Entries
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Generate invoice lines from tracked time?
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This will find all unbilled, billable time entries associated with this project and automatically convert them into invoice line items based on their hourly rates.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Generate Items"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
