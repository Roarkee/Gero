import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input } from "../ui";
import { Loader2, AlertCircle, DollarSign, Clock, TrendingUp } from "lucide-react";
import apiClient from "../../api/client";
import toast from "react-hot-toast";

export function PricingCard({ requestId, initialData, onComplete, onBack }) {
  const [data, setData] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchedRef = useRef(!!initialData);

  const fetchPricing = async (customFeedback = "") => {
    if (customFeedback) {
      setIsGenerating(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await apiClient.post("/api/ai/pricing/", { 
        request_id: requestId, 
        feedback: customFeedback 
      });
      setData(response.data);
      if (customFeedback) {
        setFeedback("");
        toast.success("Regenerated successfully based on feedback.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to generate pricing.");
      toast.error(customFeedback ? "Regeneration failed." : "Pricing generation failed.");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }
    if (requestId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchPricing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, initialData]);

  const handleEditToggle = () => {
    if (isEditing) {
      try {
        const parsed = JSON.parse(editJson);
        apiClient.post("/api/ai/pricing/", { request_id: requestId, manual_edits: parsed })
          .then(res => {
            setData(res.data);
            setIsEditing(false);
            toast.success("Manual edits saved.");
          })
          .catch(err => toast.error("Failed to save edits to server."));
      } catch (e) {
        toast.error("Invalid JSON format");
      }
    } else {
      setEditJson(JSON.stringify(data, null, 2));
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Calculating optimal pricing strategy...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing Failed</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <div className="mt-6 flex space-x-4">
            <Button variant="outline" onClick={onBack}>Go Back</Button>
            <Button onClick={() => fetchPricing()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pricing Strategy</CardTitle>
          <CardDescription>Intelligent pricing calculation based on scope and risk factors.</CardDescription>
        </div>
        <Button variant="outline" onClick={handleEditToggle}>
          {isEditing ? "Save Edits" : "Edit Manually"}
        </Button>
      </CardHeader>
      
      {isGenerating ? (
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Regenerating based on feedback...</p>
        </CardContent>
      ) : (
        <CardContent className="space-y-8">
          {isEditing ? (
            <div className="w-full">
              <textarea
                className="w-full h-96 p-4 font-mono text-sm border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
              />
            </div>
          ) : (
            <>
              {/* Main Price Display */}
              <div className="rounded-2xl bg-gray-900 p-8 text-center dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Recommended Price</p>
                <div className="mt-4 flex items-center justify-center text-5xl font-extrabold text-white">
                  <span className="text-emerald-400 mr-2">GH₵</span>
                  {data.final_price.toLocaleString()}
                </div>
                <p className="mt-4 text-sm text-gray-400 max-w-lg mx-auto">
                  {data.pricing_reasoning}
                </p>
              </div>

              {/* Pricing Metrics */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col items-center p-4 border rounded-xl dark:border-gray-800">
                  <Clock className="h-6 w-6 text-blue-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Blended Rate</span>
                  <span className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">GHS {data.hourly_rate}/hr</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-xl dark:border-gray-800">
                  <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Risk Multiplier</span>
                  <span className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{data.complexity_multiplier}x</span>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-xl dark:border-gray-800">
                  <span className="text-emerald-500 mb-2 font-bold text-xl">GH₵</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Negotiation Floor</span>
                  <span className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">GHS {data.negotiation_floor.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Schedule */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Proposed Payment Schedule</h4>
                <div className="rounded-lg border dark:border-gray-800 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100">Deposit</td>
                        <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-400 text-right">{data.payment_schedule.deposit}</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100">Milestone 1</td>
                        <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-400 text-right">{data.payment_schedule.milestone_1}</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100">Milestone 2</td>
                        <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 dark:text-gray-400 text-right">{data.payment_schedule.milestone_2}</td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900 dark:text-gray-100">Final Payment</td>
                        <td className="whitespace-nowrap py-4 px-3 text-sm font-bold text-gray-900 dark:text-gray-100 text-right">{data.payment_schedule.final_payment}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!isEditing && (
            <div className="mt-8 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Provide feedback to adjust pricing:
              </label>
              <div className="flex gap-2">
                <Input 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Decrease the final price by 10%"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && fetchPricing(feedback)}
                />
                <Button variant="secondary" onClick={() => fetchPricing(feedback)} disabled={isGenerating}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>Back</Button>
        <Button onClick={() => onComplete(data)} disabled={isGenerating || isEditing}>Generate Proposal</Button>
      </CardFooter>
    </Card>
  );
}
