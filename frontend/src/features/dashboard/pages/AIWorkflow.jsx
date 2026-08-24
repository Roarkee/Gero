import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/client";
import { Loader2 } from "lucide-react";
import { WorkflowStepper } from "../../../components/ai/WorkflowStepper";
import { ClientRequestForm } from "../../../components/ai/ClientRequestForm";
import { ExtractionPreview } from "../../../components/ai/ExtractionPreview";
import { ScopeAnalysisCard } from "../../../components/ai/ScopeAnalysisCard";
import { PricingCard } from "../../../components/ai/PricingCard";
import { ProposalPreview } from "../../../components/ai/ProposalPreview";
import { ContractPreview } from "../../../components/ai/ContractPreview";
import { ProjectGenerationPreview } from "../../../components/ai/ProjectGenerationPreview";

export default function AIWorkflow() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [requestId, setRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiData, setAiData] = useState({
    extraction: null,
    scope: null,
    pricing: null,
    proposal: null,
    contract: null,
  });

  useEffect(() => {
    if (id) {
      const fetchWorkflowState = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get(`/api/ai/ai-requests/${id}/workflow_state/`);
          const data = response.data;
          
          setRequestId(data.request_id);
          setAiData({
            extraction: data.extraction,
            scope: data.scope,
            pricing: data.pricing,
            proposal: data.proposal,
            contract: data.contract,
          });
          
          // Determine current step
          if (data.project_id) {
            setCurrentStep(7);
          } else if (data.contract) {
            setCurrentStep(6);
          } else if (data.proposal) {
            setCurrentStep(5);
          } else if (data.pricing) {
            setCurrentStep(4);
          } else if (data.scope) {
            setCurrentStep(3);
          } else if (data.extraction) {
            setCurrentStep(2);
          } else {
            setCurrentStep(1);
          }
        } catch (err) {
          console.error("Failed to load workflow state", err);
          navigate("/dashboard/ai-history");
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchWorkflowState();
    }
  }, [id, navigate]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 7));
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

  const handleContractComplete = (data) => {
    setAiData((prev) => ({ ...prev, contract: data }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 p-6 pb-12">
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
              onNext={nextStep}
            />
          )}
          {currentStep === 6 && (
            <ContractPreview
              requestId={requestId}
              onComplete={handleContractComplete}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}
          {currentStep === 7 && (
            <ProjectGenerationPreview
              requestId={requestId}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  );
}
