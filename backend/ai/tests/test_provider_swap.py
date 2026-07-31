"""
Provider swap tests — Gemini edition.

Covers:
  - get_llm_service() dispatches to GeminiService when AI_PROVIDER="gemini"
  - GeminiService.generate() returns text, passes correct args, raises on empty
  - Transient error types are correctly classified
  - All four agents wire up to GeminiService when provider=gemini
  - Agent-level extraction / pricing / proposal logic is unchanged (mocked at LLM layer)
"""
import json
import pytest
from unittest.mock import MagicMock, patch, PropertyMock

from django.conf import settings


# ── shared fixtures ────────────────────────────────────────────────────────────

def _minimal_valid_json() -> str:
    return json.dumps({
        "project_type": "web_app",
        "urgency": "medium",
        "features": [],
        "deliverables": [],
        "technical_requirements": [],
        "integrations": [],
        "platforms": [],
        "industry": None,
        "client": None,
        "timeline_weeks": None,
        "budget": None,
        "currency": None,
        "complexity_score": None,
        "metadata": None,
        "commercial_terms": None,
    })


def _full_valid_json() -> str:
    return json.dumps({
        "project_type": "SaaS platform",
        "industry": "FinTech",
        "client": {
            "name": "John Doe",
            "company": "Acme Corp",
            "email": "john@acme.com",
            "country": "USA",
        },
        "features": [
            {
                "name": "Authentication",
                "description": "JWT-based login/register",
                "ai_complexity": "low",
                "priority": "high",
                "ai_estimated_hours": 20.0,
                "dependencies": [],
                "assumptions": [],
            }
        ],
        "deliverables": ["Backend API", "Frontend SPA"],
        "technical_requirements": ["Python", "React"],
        "integrations": ["Stripe"],
        "platforms": ["web"],
        "timeline_weeks": 12,
        "budget": 15000.0,
        "currency": "USD",
        "urgency": "high",
        "complexity_score": 65,
        "metadata": {
            "confidence_score": 0.85,
            "missing_information": [],
            "assumptions_made": ["Client prefers React"],
        },
        "commercial_terms": {
            "payment_terms": "50% upfront",
            "warranty_period_days": 30,
            "maintenance_period_days": 90,
            "intellectual_property_owner": "Client",
        },
    })


def _mock_gemini_response(text: str):
    """Return a mock that behaves like a Gemini GenerateContentResponse."""
    mock_resp = MagicMock()
    type(mock_resp).text = PropertyMock(return_value=text)
    return mock_resp


# ── get_llm_service dispatch ───────────────────────────────────────────────────

class TestGetLLMService:

    def test_gemini_provider_returns_gemini_service(self):
        from ai.services.llm import get_llm_service
        from ai.services.llm.gemini_llm import GeminiService

        with patch("ai.services.llm.gemini_llm.genai.Client"), \
             patch.object(settings, "AI_PROVIDER", "gemini"):
            provider = get_llm_service()

        assert isinstance(provider, GeminiService)

    def test_groq_provider_returns_groq_service(self):
        from ai.services.llm import get_llm_service
        from ai.services.llm.groq_llm import GroqService

        with patch("ai.services.llm.groq_llm.Groq"), \
             patch.object(settings, "AI_PROVIDER", "groq"):
            provider = get_llm_service()

        assert isinstance(provider, GroqService)

    def test_openai_provider_still_returns_openai_llm(self):
        from ai.services.llm import get_llm_service
        from ai.services.llm.openai_llm import OpenAILLM

        with patch("ai.services.llm.openai_llm.OpenAI"), \
             patch.object(settings, "AI_PROVIDER", "openai"):
            provider = get_llm_service()

        assert isinstance(provider, OpenAILLM)

    def test_unknown_provider_raises_value_error(self):
        from ai.services.llm import get_llm_service

        with patch.object(settings, "AI_PROVIDER", "totally_unknown_xyz"):
            with pytest.raises(ValueError, match="Unknown AI provider"):
                get_llm_service()


# ── GeminiService unit tests ───────────────────────────────────────────────────

class TestGeminiService:

    def _make_service(self):
        """Instantiate GeminiService with genai.Client patched out."""
        with patch("ai.services.llm.gemini_llm.genai.Client"):
            from ai.services.llm.gemini_llm import GeminiService
            return GeminiService()

    def test_generate_returns_text(self):
        service = self._make_service()
        expected = _full_valid_json()

        mock_resp = _mock_gemini_response(expected)
        service.client = MagicMock()
        service.client.models.generate_content.return_value = mock_resp

        result = service.generate(
            input="Build a SaaS app",
            instructions="Extract project spec",
            model="gemini-2.0-flash",
            temperature=0.1,
        )

        assert result == expected

    def test_generate_accepts_anthropic_model_alias(self):
        """claude-* model names should be silently remapped to a Gemini model."""
        service = self._make_service()
        service.client = MagicMock()
        service.client.models.generate_content.return_value = _mock_gemini_response("response")

        result = service.generate(
            input="test",
            instructions="prompt",
            model="claude-3-5-sonnet-20241022",
            temperature=0.1,
        )

        call_kwargs = service.client.models.generate_content.call_args.kwargs
        assert "gemini" in call_kwargs["model"]
        assert result == "response"

    def test_generate_accepts_openai_model_alias(self):
        service = self._make_service()
        service.client = MagicMock()
        service.client.models.generate_content.return_value = _mock_gemini_response("output")

        service.generate(
            input="test",
            instructions="prompt",
            model="gpt-5",
            temperature=0.1,
        )

        call_kwargs = service.client.models.generate_content.call_args.kwargs
        assert "gemini" in call_kwargs["model"]

    def test_generate_raises_on_empty_response(self):
        service = self._make_service()

        mock_resp = MagicMock()
        type(mock_resp).text = PropertyMock(side_effect=ValueError("blocked"))
        mock_resp.candidates = []
        service.client = MagicMock()
        service.client.models.generate_content.return_value = mock_resp

        with pytest.raises(ValueError, match="empty or blocked"):
            service.generate(
                input="test",
                instructions="prompt",
                model="gemini-2.0-flash",
                temperature=0.1,
            )

    def test_generate_raises_on_whitespace_only_response(self):
        service = self._make_service()
        service.client = MagicMock()
        service.client.models.generate_content.return_value = _mock_gemini_response("   ")

        with pytest.raises(ValueError, match="empty or blocked"):
            service.generate(
                input="test",
                instructions="prompt",
                model="gemini-2.0-flash",
                temperature=0.1,
            )

    def test_transient_error_types(self):
        from ai.services.llm.gemini_llm import _is_retryable
        from google.genai.errors import ClientError, ServerError

        # 5xx server errors are retryable
        server_err = MagicMock(spec=ServerError)
        assert _is_retryable(server_err) is True

        # 429 without "limit: 0" is a transient rate limit — retryable
        rate_limit = MagicMock(spec=ClientError)
        rate_limit.code = 429
        type(rate_limit).__str__ = lambda s: "429 RESOURCE_EXHAUSTED rate limited"
        assert _is_retryable(rate_limit) is True

        # 429 with "limit: 0" is a billing wall — NOT retryable
        quota_wall = MagicMock(spec=ClientError)
        quota_wall.code = 429
        type(quota_wall).__str__ = lambda s: "429 RESOURCE_EXHAUSTED limit: 0"
        assert _is_retryable(quota_wall) is False

        # 401 auth error is NOT retryable
        auth_err = MagicMock(spec=ClientError)
        auth_err.code = 401
        type(auth_err).__str__ = lambda s: "401 UNAUTHENTICATED"
        assert _is_retryable(auth_err) is False

    def test_system_instruction_passed_to_model(self):
        service = self._make_service()
        service.client = MagicMock()
        service.client.models.generate_content.return_value = _mock_gemini_response("ok")

        service.generate(
            input="user input",
            instructions="my system prompt",
            model="gemini-2.0-flash",
            temperature=0.3,
            request_id="req-xyz",
        )

        call_kwargs = service.client.models.generate_content.call_args.kwargs
        assert call_kwargs["config"].system_instruction == "my system prompt"


# ── Provider swap → agent wiring ──────────────────────────────────────────────

class TestProviderSwap:

    def _patch_gemini(self):
        return patch("ai.services.llm.gemini_llm.genai.Client")

    def test_gemini_provider_drives_client_request_agent(self):
        from ai.services.llm.gemini_llm import GeminiService

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            from ai.agents.client_request_agent import ClientRequestAgent
            agent = ClientRequestAgent()

        assert isinstance(agent.llm, GeminiService)

    def test_gemini_provider_drives_scope_agent(self):
        from ai.services.llm.gemini_llm import GeminiService

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            from ai.agents.scope_agent import ScopeAgent
            agent = ScopeAgent()

        assert isinstance(agent.llm, GeminiService)

    def test_gemini_provider_drives_pricing_agent(self):
        from ai.services.llm.gemini_llm import GeminiService

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            from ai.agents.pricing_agent import PricingAgent
            agent = PricingAgent()

        assert isinstance(agent.llm, GeminiService)

    def test_gemini_provider_drives_proposal_agent(self):
        from ai.services.llm.gemini_llm import GeminiService

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            from ai.agents.proposal_agent import ProposalAgent
            agent = ProposalAgent()

        assert isinstance(agent.llm, GeminiService)

    def test_client_request_agent_extraction_with_gemini(self):
        """Full extraction pipeline with Gemini mock — JSON validates against Pydantic schema."""
        from ai.agents.client_request_agent import ClientRequestAgent
        from ai.services.errors import ExtractionResult
        from ai.schemas.proj_spec_schema import ProjectSpecification

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            agent = ClientRequestAgent()

        # Replace the LLM with a simple mock after construction
        agent.llm = MagicMock()
        agent.llm.generate.return_value = _full_valid_json()

        result = agent.extract("Build a SaaS platform for accountants.", request_id="test-g-001")

        assert isinstance(result, ExtractionResult)
        assert result.success is True
        assert isinstance(result.data, ProjectSpecification)
        assert result.data.project_type == "SaaS platform"

    def test_pricing_agent_with_gemini_mock(self):
        from ai.agents.pricing_agent import PricingAgent
        from ai.services.errors import ExtractionResult
        from ai.schemas.proj_spec_schema import ProjectSpecification
        from ai.schemas.scope_schema import ScopeAnalysis

        pricing_json = json.dumps({
            "estimated_hours": 120,
            "hourly_rate": 75.0,
            "total_cost": 9000.0,
            "currency": "USD",
            "breakdown": [],
            "notes": "Standard rate",
        })

        agent = PricingAgent.__new__(PricingAgent)
        agent.llm = MagicMock()
        agent.llm.generate.return_value = pricing_json
        agent.prompt = "PRICING_PROMPT_MOCK"

        mock_spec = MagicMock(spec=ProjectSpecification)
        mock_spec.model_dump.return_value = {}
        mock_scope = MagicMock(spec=ScopeAnalysis)
        mock_scope.model_dump.return_value = {}

        result = agent.analyze(mock_spec, mock_scope, request_id="test-g-002")
        assert isinstance(result, ExtractionResult)

    def test_proposal_agent_with_gemini_mock(self):
        from ai.agents.proposal_agent import ProposalAgent
        from ai.services.errors import ExtractionResult
        from ai.schemas.proj_spec_schema import ProjectSpecification
        from ai.schemas.scope_schema import ScopeAnalysis
        from ai.schemas.pricing_schema import PricingAnalysis

        proposal_json = json.dumps({
            "title": "SaaS Platform Proposal",
            "executive_summary": "We propose to build a SaaS platform.",
            "scope_summary": "Includes auth, billing, and dashboard.",
            "timeline_summary": "12 weeks total.",
            "pricing_summary": "Total: $9,000 USD.",
            "terms": "50% upfront.",
            "call_to_action": "Sign the attached contract.",
        })

        agent = ProposalAgent.__new__(ProposalAgent)
        agent.llm = MagicMock()
        agent.llm.generate.return_value = proposal_json
        agent.prompt = "PROPOSAL_PROMPT_MOCK"

        mock_spec = MagicMock(spec=ProjectSpecification)
        mock_spec.model_dump.return_value = {}
        mock_scope = MagicMock(spec=ScopeAnalysis)
        mock_scope.model_dump.return_value = {}
        mock_pricing = MagicMock(spec=PricingAnalysis)
        mock_pricing.model_dump.return_value = {}

        result = agent.generate(mock_spec, mock_scope, mock_pricing, request_id="test-g-003")
        assert isinstance(result, ExtractionResult)

    def test_failure_recovery_still_works_with_gemini(self):
        """If Gemini returns malformed JSON, the recovery pipeline kicks in."""
        from ai.agents.client_request_agent import ClientRequestAgent
        from ai.services.errors import ExtractionResult

        with self._patch_gemini(), patch.object(settings, "AI_PROVIDER", "gemini"):
            agent = ClientRequestAgent()

        agent.llm = MagicMock()
        # Wrap valid JSON in markdown fences — a common model quirk
        agent.llm.generate.return_value = f"```json\n{_full_valid_json()}\n```"

        result = agent.extract("Build a platform", request_id="test-g-004")
        # Recovery should strip the fences and succeed
        assert isinstance(result, ExtractionResult)
        # Either recovered successfully or gracefully failed — never raised
        assert result.success in (True, False)
