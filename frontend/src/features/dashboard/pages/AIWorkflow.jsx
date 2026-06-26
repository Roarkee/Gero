import React, { useState } from "react";
import { WorkflowStepper } from "../../../components/ai/WorkflowStepper";
import { ClientRequestForm } from "../../../components/ai/ClientRequestForm";
import { ExtractionPreview } from "../../../components/ai/ExtractionPreview";
import { ScopeAnalysisCard } from "../../../components/ai/ScopeAnalysisCard";
import { PricingCard } from "../../../components/ai/PricingCard";
import { ProposalPreview } from "../../../components/ai/ProposalPreview";

export default function AIWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [requestId, setRequestId] = useState(null);
  const [aiData, setAiData] = useState({
    extraction: null,
    scope: null,
    pricing: null,
    proposal: null,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleExtractionComplete = (id, data) => {
    setRequestId(id);
    setAiData((prev) => ({ ...prev, extraction: data }));
    nextStep();
  };

  const handleScopeComplete = (data) => {
    setAiData((prev) => ({ ...prev, scope: data }));
    nextStep();
  };

  const handlePricingComplete = (data) => {
    setAiData((prev) => ({ ...prev, pricing: data }));
    nextStep();
  };

  const handleProposalComplete = (data) => {
    setAiData((prev) => ({ ...prev, proposal: data }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Client Project Workflow
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Automate extraction, scoping, pricing, and proposal generation.
        </p>
      </div>

      <WorkflowStepper currentStep={currentStep} />

      <div className="mt-8">
        {currentStep === 1 && (
          <ClientRequestForm onComplete={handleExtractionComplete} />
        )}
        {currentStep === 2 && (
          <ExtractionPreview
            data={aiData.extraction}
            onContinue={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && (
          <ScopeAnalysisCard
            requestId={requestId}
            onComplete={handleScopeComplete}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && (
          <PricingCard
            requestId={requestId}
            onComplete={handlePricingComplete}
            onBack={prevStep}
          />
        )}
        {currentStep === 5 && (
          <ProposalPreview
            requestId={requestId}
            onComplete={handleProposalComplete}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
}
