import React from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "../ui";

export function ExtractionPreview({ data, onContinue, onBack }) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extraction Results</CardTitle>
        <CardDescription>Review the project details extracted by AI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          Generate Scope Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}
