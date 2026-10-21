import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import { Loader2 } from "lucide-react";
import { ClientRequestForm } from "../components/ClientRequestForm";
import { ExtractionPreview } from "../components/ExtractionPreview";
import { ScopeAnalysisCard } from "../components/ScopeAnalysisCard";
import { PricingCard } from "../components/PricingCard";
import { ProposalPreview } from "../components/ProposalPreview";
import { ContractPreview } from "../components/ContractPreview";
import { ProjectGenerationPreview } from "../components/ProjectGenerationPreview";

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
    project_id: null,
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
            project_id: data.project_id,
          });
          
          // Determine current step based on highest completed artifact
          if (data.project_id) {
            setCurrentStep(7);
          } else if (data.contract) {
            setCurrentStep(7); // Next is Project Gen
          } else if (data.proposal) {
            setCurrentStep(6); // Next is Contract
          } else if (data.pricing) {
            setCurrentStep(5); // Next is Proposal
          } else if (data.scope) {
            setCurrentStep(4); // Next is Pricing
          } else if (data.extraction) {
            setCurrentStep(3); // Next is Scope
          } else {
            setCurrentStep(2); // Next is Extraction
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

  const advanceStep = (step) => {
    setCurrentStep(step);
  };

  const handleExtractionComplete = (id, data) => {
    setRequestId(id);
    setAiData((prev) => ({ ...prev, extraction: data }));
    advanceStep(3);
  };

  const handleScopeComplete = (data) => {
    setAiData((prev) => ({ ...prev, scope: data }));
    advanceStep(5);
  };

  const handlePricingComplete = (data) => {
    setAiData((prev) => ({ ...prev, pricing: data }));
    advanceStep(6);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              AI Workspace
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Your intelligent project assistant. Generate and manage artifacts iteratively.
            </p>
          </div>
          <button 
            onClick={() => navigate("/dashboard/ai-history")}
            className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            View History
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => advanceStep(2)}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                1. Client Request
                {aiData.extraction && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep <= 2 && (
              <div className="p-6">
                <ClientRequestForm onComplete={handleExtractionComplete} />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.extraction) advanceStep(3) }}
              disabled={!aiData.extraction}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                2. Requirements Extraction
                {aiData.scope && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep === 3 && (
              <div className="p-6">
                <ExtractionPreview
                  requestId={requestId}
                  data={aiData.extraction}
                  onContinue={() => advanceStep(4)}
                  onBack={() => advanceStep(2)}
                  onUpdate={(newData) => setAiData(prev => ({...prev, extraction: newData}))}
                />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.extraction) advanceStep(4) }}
              disabled={!aiData.extraction}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                3. Scope Analysis
                {aiData.pricing && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep === 4 && (
              <div className="p-6">
                <ScopeAnalysisCard
                  requestId={requestId}
                  initialData={aiData.scope}
                  onComplete={handleScopeComplete}
                  onBack={() => advanceStep(3)}
                />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.scope) advanceStep(5) }}
              disabled={!aiData.scope}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                4. Pricing Strategy
                {aiData.proposal && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep === 5 && (
              <div className="p-6">
                <PricingCard
                  requestId={requestId}
                  initialData={aiData.pricing}
                  onComplete={handlePricingComplete}
                  onBack={() => advanceStep(4)}
                />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.pricing) advanceStep(6) }}
              disabled={!aiData.pricing}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                5. Proposal Generation
                {aiData.contract && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep === 6 && (
              <div className="p-6">
                <ProposalPreview
                  requestId={requestId}
                  initialData={aiData.proposal}
                  onComplete={handleProposalComplete}
                  onBack={() => advanceStep(5)}
                  onNext={() => advanceStep(7)}
                />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.proposal) advanceStep(7) }}
              disabled={!aiData.proposal}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                6. Contract Generation
                {aiData.project_id && <span className="text-emerald-500 text-sm font-medium border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>}
              </h3>
            </button>
            {currentStep === 7 && (
              <div className="p-6">
                <ContractPreview
                  requestId={requestId}
                  initialData={aiData.contract}
                  onComplete={handleContractComplete}
                  onBack={() => advanceStep(6)}
                  onNext={() => advanceStep(8)}
                />
              </div>
            )}
          </div>

          <div className="border dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <button 
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              onClick={() => { if (aiData.contract) advanceStep(8) }}
              disabled={!aiData.contract}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                7. Project Generation
              </h3>
            </button>
            {currentStep === 8 && (
              <div className="p-6">
                <ProjectGenerationPreview
                  requestId={requestId}
                  initialProjectId={aiData.project_id}
                  onBack={() => advanceStep(7)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

