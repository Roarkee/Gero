import React, { useRef, useState } from "react";
import { useProjectAttachments } from "../hooks/useProjects";
import { UploadCloud, File, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

export default function ProjectFilesTab({ project }) {
  const { attachmentsQuery, createAttachment, deleteAttachment } = useProjectAttachments(project.id);
  const { data: rawAttachments, isLoading } = attachmentsQuery;
  const attachments = rawAttachments?.results || rawAttachments || [];
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const projectAttachments = attachments.filter(a => a.project === project.id);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project", project.id);

    try {
      await createAttachment.mutateAsync(formData);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Upload Section */}
      <div className="mb-8">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <UploadCloud className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isUploading ? "Uploading..." : "Click or drag file to this area to upload"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
          </p>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Files ({projectAttachments.length})</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div></div>
        ) : projectAttachments.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No files uploaded yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {projectAttachments.map((file) => (
              <li key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                    <File className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.file_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at), "MMM d, yyyy")} • by {file.uploaded_by_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a 
                    href={file.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => deleteAttachment.mutate(file.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
