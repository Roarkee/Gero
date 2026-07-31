import { useState } from "react";
import { Upload, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";
import toast from "react-hot-toast";

export default function NewRequest() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !file) {
      toast.error("Please enter a message or upload a project specification file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractionResult(null);

    const formData = new FormData();
    if (message.trim()) {
      formData.append("message", message);
    }
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.PORTAL_REQUESTS, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setExtractionResult(response.data);
      toast.success("Request submitted successfully!");
      setMessage("");
      setFile(null);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to submit project request.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submit New Project Request</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Provide your project requirements. Our AI will automatically parse the scope, tasks, and draft a proposal for your freelancer.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Specification */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Project Description</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you want built, key features, milestones, and requirements..."
              className="w-full min-h-[150px] p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* File Spec Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Upload Spec Document (Optional)</label>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">PDF, DOCX, TXT up to 10MB</p>
                {file && (
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                    Selected file: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isLoading ? "AI processing specifications..." : "Submit Project Request"}
          </button>
        </form>
      </div>

      {/* Loading States / Interactive Results */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Extraction Agent is Analyzing</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            We are extracting scope details, tasks, deliverables, and estimated pricing from your input. This will take a moment.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400">Analysis Failed</h3>
            <p className="text-xs text-rose-700 dark:text-rose-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      {extractionResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Request Successfully Extracted</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">
                Your freelancer has been notified. They can now review the AI-extracted details below on their dashboard:
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Project Type:</span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">{extractionResult.project_type || "N/A"}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>AI Request ID:</span>
              <span className="font-mono text-gray-900 dark:text-white">{extractionResult.ai_request_id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
