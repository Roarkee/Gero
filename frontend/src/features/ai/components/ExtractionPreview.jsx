import React, { useState } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input } from "@/components/ui";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import toast from "react-hot-toast";

export function ExtractionPreview({ requestId, data, onContinue, onBack, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) return null;

  const handleEditToggle = () => {
    if (isEditing) {
      try {
        const parsed = JSON.parse(editJson);
        apiClient.patch(`/api/ai/ai-requests/${requestId}/`, { parsed_output: parsed })
          .then(res => {
            onUpdate(res.data);
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

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter some feedback first.");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await apiClient.patch(`/api/ai/ai-requests/${requestId}/`, { feedback });
      onUpdate(response.data);
      setFeedback("");
      toast.success("Regenerated successfully based on feedback.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Regeneration failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Extraction Results</CardTitle>
          <CardDescription>Review the project details extracted by AI.</CardDescription>
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
        <CardContent className="space-y-6">
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
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Type</h4>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{data.project_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</h4>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{data.industry || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</h4>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {data.budget ? `${data.currency || "GHS"} ${data.budget}` : "TBD"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline</h4>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {data.timeline_weeks ? `${data.timeline_weeks} weeks` : "TBD"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgency</h4>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {data.urgency}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Technical Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {data.technical_requirements?.length > 0 ? (
                    data.technical_requirements.map((req, i) => (
                      <Badge key={i} variant="secondary">{req}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">None detected</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Key Features</h4>
                <ul className="space-y-3">
                  {data.features?.map((feat, i) => (
                    <li key={i} className="rounded-md bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{feat.name}</span>
                        <Badge variant="outline" className="capitalize text-xs">{feat.ai_complexity}</Badge>
                      </div>
                      {feat.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{feat.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!isEditing && (
            <div className="mt-8 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Provide feedback to refine the extraction:
              </label>
              <div className="flex gap-2">
                <Input 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Add a mobile app requirement"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                />
                <Button variant="secondary" onClick={handleRegenerate} disabled={isGenerating}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={isGenerating || isEditing}>
          Generate Scope Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}
