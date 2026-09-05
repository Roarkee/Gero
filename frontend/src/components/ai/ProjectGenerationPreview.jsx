import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardContent } from "../ui";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function ProjectGenerationPreview({ requestId, initialProjectId, onBack }) {
  const [projectId, setProjectId] = useState(initialProjectId || null);
  const [isLoading, setIsLoading] = useState(!initialProjectId);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const fetchedRef = useRef(!!initialProjectId);

  const generateProject = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/ai/project-plan/", { request_id: requestId });
      setProjectId(response.data.project_id);
      toast.success("Project created successfully!");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate project.");
      toast.error("Project generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }
    if (requestId && !fetchedRef.current) {
      fetchedRef.current = true;
      generateProject();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, initialProjectId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Structuring Gero Project</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-center">
            Our AI is generating task lists, tasks, and subtasks...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generation Failed</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={generateProject}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Created Successfully</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The project plan has been fully converted into actionable Gero objects. 
            All tasks, lists, and estimates are ready for execution.
          </p>
        </div>
        <Button 
          size="lg" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          Open Project Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
