import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { Loader2, Plus, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import apiClient from "@/api/client";
import toast from "react-hot-toast";

export default function AIHistory() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get("/api/ai/ai-requests/");
        const responseData = response?.data || {};
        const data = responseData.results !== undefined ? responseData.results : (Array.isArray(responseData) ? responseData : []);
        setRequests(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load AI requests.");
        toast.error("Could not fetch workflow history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatStage = (stage) => {
    if (!stage) return "Unknown";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status, stage) => {
    if (stage === "project_generation") {
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
    }
    if (status === "failed" || stage.includes("failed")) {
        return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              AI Workflow History
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              View past requests, resume in-progress workflows, or start a new project.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/dashboard/ai-workflow/new")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No AI Requests Yet</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                Start your first AI-powered project estimation by creating a new request.
              </p>
              <Button onClick={() => navigate("/dashboard/ai-workflow/new")}>
                Start AI Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <Card 
                key={req.id} 
                className="hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/dashboard/ai-workflow/${req.id}`)}
              >
                <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                        #{req.id}
                      </span>
                      {getStatusBadge(req.status, req.current_stage)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                      <span>&bull;</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Stage: {formatStage(req.current_stage)}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" className="shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Resume Workflow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

