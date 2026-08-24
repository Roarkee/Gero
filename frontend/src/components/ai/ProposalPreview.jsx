import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Textarea } from "../ui";
import { Loader2, AlertCircle, FileText, Download } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";

export function ProposalPreview({ requestId, onComplete, onBack, onNext }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editableText, setEditableText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchedRef = useRef(false);

  const fetchProposal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/ai/proposal/", { request_id: requestId });
      setData(response.data);
      setEditableText(response.data.proposal_text);
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate proposal.");
      toast.error("Proposal generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchProposal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const handleNext = async () => {
    if (!onNext) return;
    
    setIsSaving(true);
    try {
      await apiClient.put("/api/ai/proposal/", { 
        request_id: requestId,
        proposal_text: editableText
      });
      // Optionally update local data state if onComplete relies on it, 
      // but onNext just moves to the next step
      const updatedData = { ...data, proposal_text: editableText };
      setData(updatedData);
      if (onComplete) {
        onComplete(updatedData);
      }
      onNext();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save proposal edits.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([editableText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal_${requestId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Crafting professional proposal...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Proposal Failed</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={fetchProposal}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{data.title}</CardTitle>
            <CardDescription className="mt-1">Generated Executive Proposal</CardDescription>
          </div>
          <FileText className="h-8 w-8 text-emerald-500" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 p-6">
        {/* Executive Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Executive Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {data.project_summary}
          </p>
        </div>

        {/* Scope of Work */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Scope of Work</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {data.scope_of_work.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Milestones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timeline & Milestones</h3>
          <div className="space-y-4">
            {data.milestones.map((milestone, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-950">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{milestone.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{milestone.description}</p>
                </div>
                <div className="mt-2 sm:mt-0 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {milestone.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Investment Required</h3>
          <div className="flex justify-between items-center pb-2 border-b dark:border-gray-800 mb-2">
            <span className="text-sm text-gray-500">Base Cost</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.pricing_breakdown.base_cost}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total Investment</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.pricing_breakdown.total_investment}</span>
          </div>
        </div>

        {/* Editable Proposal Text */}
        <div className="space-y-2 pt-4 border-t dark:border-gray-800">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Edit Cover Letter / Proposal Content
          </label>
          <Textarea 
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={12}
            className="font-serif text-sm leading-relaxed"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t dark:border-gray-800 pt-6">
        <Button variant="outline" onClick={onBack}>Back to Pricing</Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleExport} className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950">
            <Download className="mr-2 h-4 w-4" />
            Export Proposal
          </Button>
          {onNext && (
            <Button onClick={handleNext} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Contract
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
