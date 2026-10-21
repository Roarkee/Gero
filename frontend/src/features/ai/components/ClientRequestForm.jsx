import React, { useState } from "react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Textarea } from "@/components/ui";
import { UploadCloud, Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import toast from "react-hot-toast";

export function ClientRequestForm({ onComplete }) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !file) {
      toast.error("Please provide a project description or upload a file.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      if (message) formData.append("message", message);
      if (file) formData.append("file", file);

      const response = await apiClient.post("/api/ai/ai-requests/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      toast.success("Extraction complete!");
      onComplete(response.data.id, response.data.parsed_output);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to analyze project.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Request</CardTitle>
        <CardDescription>
          Paste the client's project brief or upload their PDF/DOCX to begin the automated workflow.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Project Description
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., We need a SaaS platform with Stripe payments..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Or Upload Brief
            </label>
            <div className="flex w-full items-center justify-center">
              <label
                htmlFor="dropzone-file"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5 pointer-events-none">
                  <UploadCloud className={`mb-4 h-8 w-8 ${isDragActive ? "text-indigo-500" : "text-gray-500 dark:text-gray-400"}`} />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF or DOCX (MAX. 10MB)
                  </p>
                </div>
                <Input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </div>
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {file.name}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Project
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
