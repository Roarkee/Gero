import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "../ui";
import { Loader2, AlertCircle } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";

export function ScopeAnalysisCard({ requestId, onComplete, onBack }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track if we've already fetched to prevent double calls in StrictMode
  const fetchedRef = useRef(false);

  const fetchScope = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/ai/scope-analysis/", { request_id: requestId });
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate scope analysis.");
      toast.error("Scope Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchScope();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Analyzing project scope and estimating hours...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis Failed</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={fetchScope}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope Analysis</CardTitle>
        <CardDescription>AI-generated engineering scope and effort estimation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/20">
            <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Estimated Hours</h4>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{data.estimated_total_hours}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Delivery Confidence</h4>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{(data.delivery_confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Phase Breakdown</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Object.entries(data.phase_breakdown).map(([phase, hours]) => (
              <div key={phase} className="flex justify-between border-b pb-2 dark:border-gray-800">
                <span className="capitalize text-sm text-gray-500 dark:text-gray-400">{phase}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{hours}h</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Recommended Team</h4>
          <div className="flex flex-wrap gap-2">
            {data.recommended_team.map((role, i) => (
              <Badge key={i} variant="secondary">{role}</Badge>
            ))}
          </div>
        </div>

        {data.technical_risks?.length > 0 && (
          <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Technical Risks</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                  <ul className="list-disc space-y-1 pl-5">
                    {data.technical_risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={() => onComplete(data)}>Generate Pricing</Button>
      </CardFooter>
    </Card>
  );
}
