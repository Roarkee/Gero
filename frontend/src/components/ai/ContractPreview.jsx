import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Textarea } from "../ui";
import { Loader2, AlertCircle, Scale, Download } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";

export function ContractPreview({ requestId, onComplete, onBack, onNext }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editableText, setEditableText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchedRef = useRef(false);

  const fetchContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/api/ai/contract/", { request_id: requestId });
      setData(response.data);
      setEditableText(response.data.contract_text);
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate contract.");
      toast.error("Contract generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchContract();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const handleNext = async () => {
    if (!onNext) return;
    
    setIsSaving(true);
    try {
      await apiClient.put("/api/ai/contract/", { 
        request_id: requestId,
        contract_text: editableText
      });
      const updatedData = { ...data, contract_text: editableText };
      setData(updatedData);
      if (onComplete) {
        onComplete(updatedData);
      }
      onNext();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save contract edits.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([editableText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract_${requestId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Drafting professional service agreement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contract Generation Failed</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={fetchContract}>Retry</Button>
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
            <CardTitle className="text-2xl">{data.contract_title || "Freelance Service Agreement"}</CardTitle>
            <CardDescription className="mt-1">Generated Draft Contract</CardDescription>
          </div>
          <Scale className="h-8 w-8 text-emerald-500" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 p-6">
        {/* Editable Contract Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Review and Edit Contract Content
          </label>
          <Textarea 
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={20}
            className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t dark:border-gray-800 pt-6">
        <Button variant="outline" onClick={onBack}>Back to Proposal</Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleExport} className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950">
            <Download className="mr-2 h-4 w-4" />
            Export Contract
          </Button>
          {onNext && (
            <Button onClick={handleNext} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Project
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
