import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileIcon, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
};

export default function FilesTab({ projectId }) {
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["portal", "files", projectId],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.PORTAL_FILES(projectId));
      return res.data?.results ?? res.data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiClient.post(API_ENDPOINTS.PORTAL_FILES(projectId), fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "files", projectId] });
      toast.success("File uploaded.");
    },
    onError: () => toast.error("Upload failed."),
  });

  const handleFiles = (fileList) => {
    Array.from(fileList).forEach((f) => upload.mutate(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (isLoading) {
    return <div className="animate-pulse h-40 rounded-xl bg-gray-100 dark:bg-gray-700" />;
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {upload.isPending ? (
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading…
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drop files here or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No files shared yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <FileIcon className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.file_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(f.file_size)} · {f.uploaded_by_name} · {format(new Date(f.uploaded_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <a
                href={f.file}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
