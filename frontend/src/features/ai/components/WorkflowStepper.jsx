import React from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

const steps = [
  { id: 1, name: "Request Input" },
  { id: 2, name: "Extraction" },
  { id: 3, name: "Scope Analysis" },
  { id: 4, name: "Pricing" },
  { id: 5, name: "Proposal" },
  { id: 6, name: "Contract" },
];

export function WorkflowStepper({ currentStep }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={clsx(
              stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
              "relative"
            )}
          >
            {step.id < currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-emerald-500" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600">
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-900"
                  aria-current="step"
                >
                  <span className="text-sm font-medium text-emerald-500">
                    {step.id}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {step.id}
                  </span>
                </div>
              </>
            )}
            <span className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
