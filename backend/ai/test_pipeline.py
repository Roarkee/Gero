"""
QA + Hardening Test Suite — Gero AI Pipeline
=============================================
Sections:
  1.  InputProcessor  (text / PDF / DOCX / unsupported / file-size guard / empty extraction)
  2.  Pydantic schema validation
  3.  ClientRequestAgent (ExtractionResult envelope, mocked LLM)
  4.  Edge cases
  5.  Django REST API endpoint
  6.  OpenAI LLM class (unit)
  7.  Recovery pipeline (JSON repair Stages 1 & 2)
  8.  Sanitization layer
"""

import json
import pytest
from unittest.mock import MagicMock, patch

from pydantic import ValidationError
from rest_framework.test import APIClient

# ─── App imports ────────────────────────────────────────────────────────────
from ai.services.ingestion import InputProcessor, PDFParser, DOCXParser
from ai.schemas.proj_spec_schema import (
    ProjectSpecification, FeatureSchema, ClientInfoSchema,
    ExtractionMetadata, CommercialTerms,
)
from ai.agents.client_request_agent import ClientRequestAgent
from ai.services.errors import ExtractionResult, PipelineError, ErrorType, Stage


# ═══════════════════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def _make_file(name: str, content: bytes, size: int | None = None) -> MagicMock:
    """Return a mock file object that mimics Django InMemoryUploadedFile."""
    f = MagicMock()
    f.name = name
    f.read.return_value = content
    # .size attribute used by the file size guard
    f.size = size if size is not None else len(content)
    return f


def _minimal_valid_json() -> str:
    """Smallest possible JSON string that satisfies the schema."""
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


def _agent_with_mock_llm(llm_response: str) -> ClientRequestAgent:
    """Construct a ClientRequestAgent with the LLM mocked to return llm_response."""
    agent = ClientRequestAgent.__new__(ClientRequestAgent)
    mock_llm = MagicMock()
    mock_llm.generate.return_value = llm_response
    agent.llm = mock_llm
    agent.prompt = "MOCK_PROMPT"
    return agent


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 1 — INPUT PROCESSOR
# ═══════════════════════════════════════════════════════════════════════════

class TestInputProcessor:
    """Tests for InputProcessor, PDFParser, DOCXParser."""

    # T-IP-01  plain text passthrough
    def test_plain_text_passthrough(self):
        text = "Build me an e-commerce website with Stripe payments."
        result = InputProcessor.process(text=text)
        assert result == text

    # T-IP-02  empty string → ValueError
    def test_empty_string_raises_value_error(self):
        with pytest.raises(ValueError, match="empty"):
            InputProcessor.process(text="", file=None)

    # T-IP-03  whitespace-only string → ValueError
    def test_whitespace_only_raises_value_error(self):
        with pytest.raises(ValueError, match="empty"):
            InputProcessor.process(text="   \n\t  ", file=None)

    # T-IP-04  None text + None file → ValueError
    def test_none_text_none_file_raises_value_error(self):
        with pytest.raises(ValueError, match="No input provided"):
            InputProcessor.process(text=None, file=None)

    # T-IP-05  PDF extraction (mocked fitz)
    @patch("ai.services.ingestion.fitz")
    def test_pdf_extraction_success(self, mock_fitz):
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Extracted PDF content."
        mock_pdf = MagicMock()
        mock_pdf.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_fitz.open.return_value = mock_pdf

        file = _make_file("brief.pdf", b"%PDF-1.4 fake")
        result = InputProcessor.process(file=file)
        assert "Extracted PDF content." in result

    # T-IP-06  PDF fitz error → raises ValueError
    @patch("ai.services.ingestion.fitz")
    def test_pdf_extraction_exception_raises_value_error(self, mock_fitz):
        mock_fitz.open.side_effect = Exception("Corrupt PDF")
        file = _make_file("bad.pdf", b"not-a-pdf")
        with pytest.raises(ValueError, match="Could not extract text from PDF"):
            PDFParser.extract(file)

    # T-IP-07  DOCX extraction (mocked python-docx)
    @patch("ai.services.ingestion.Document")
    def test_docx_extraction_success(self, mock_document_cls):
        mock_para = MagicMock()
        mock_para.text = "Requirements from DOCX."
        mock_doc = MagicMock()
        mock_doc.paragraphs = [mock_para]
        mock_document_cls.return_value = mock_doc

        file = _make_file("spec.docx", b"PK fake docx bytes")
        result = InputProcessor.process(file=file)
        assert "Requirements from DOCX." in result

    # T-IP-08  Unsupported file type → clean ValueError
    def test_unsupported_file_type_raises_value_error(self):
        file = _make_file("brief.txt", b"some text content")
        with pytest.raises(ValueError, match="Unsupported file type"):
            InputProcessor.process(file=file)

    # T-IP-09  Uppercase extension handled (case-insensitive)
    @patch("ai.services.ingestion.fitz")
    def test_uppercase_pdf_extension_accepted(self, mock_fitz):
        mock_page = MagicMock()
        mock_page.get_text.return_value = "PDF content."
        mock_pdf = MagicMock()
        mock_pdf.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_fitz.open.return_value = mock_pdf

        file = _make_file("brief.PDF", b"%PDF-1.4 fake")
        result = InputProcessor.process(file=file)
        assert "PDF content." in result

    # T-IP-10  File too large → ValueError before reading
    def test_oversized_file_raises_value_error(self):
        # 15 MB file — exceeds default 10 MB limit
        file = _make_file("huge.pdf", b"x", size=15 * 1024 * 1024)
        with pytest.raises(ValueError, match="too large"):
            InputProcessor.process(file=file)

    # T-IP-11  Image-only PDF (empty extraction) → ValueError
    @patch("ai.services.ingestion.fitz")
    def test_empty_pdf_extraction_raises_value_error(self, mock_fitz):
        """Scanned/image PDFs produce no extractable text."""
        mock_page = MagicMock()
        mock_page.get_text.return_value = ""
        mock_pdf = MagicMock()
        mock_pdf.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_fitz.open.return_value = mock_pdf

        file = _make_file("scanned.pdf", b"%PDF-1.4")
        with pytest.raises(ValueError, match="No readable text"):
            InputProcessor.process(file=file)


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 2 — PYDANTIC SCHEMA VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

class TestPydanticSchemaValidation:
    """Tests for ProjectSpecification model_validate_json()."""

    # T-PV-01  Full valid JSON
    def test_full_valid_json_passes(self):
        spec = ProjectSpecification.model_validate_json(_full_valid_json())
        assert spec.project_type == "SaaS platform"
        assert spec.urgency.value == "high"
        assert len(spec.features) == 1

    # T-PV-02  Minimal valid JSON (all optionals as null)
    def test_minimal_valid_json_passes(self):
        spec = ProjectSpecification.model_validate_json(_minimal_valid_json())
        assert spec.project_type == "web_app"
        assert spec.features == []
        assert spec.commercial_terms is None

    # T-PV-03  Missing required field `project_type`
    def test_missing_project_type_fails(self):
        data = json.loads(_minimal_valid_json())
        del data["project_type"]
        with pytest.raises(ValidationError) as exc_info:
            ProjectSpecification.model_validate_json(json.dumps(data))
        fields = [e["loc"][0] for e in exc_info.value.errors()]
        assert "project_type" in fields

    # T-PV-04  Missing required field `urgency`
    def test_missing_urgency_fails(self):
        data = json.loads(_minimal_valid_json())
        del data["urgency"]
        with pytest.raises(ValidationError) as exc_info:
            ProjectSpecification.model_validate_json(json.dumps(data))
        fields = [e["loc"][0] for e in exc_info.value.errors()]
        assert "urgency" in fields

    # T-PV-05  Feature missing required `ai_complexity`
    def test_feature_missing_ai_complexity_fails(self):
        data = json.loads(_full_valid_json())
        del data["features"][0]["ai_complexity"]
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-06  Empty `{}` object fails on required fields
    def test_empty_json_object_fails(self):
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json("{}")

    # T-PV-07  Malformed JSON string
    def test_malformed_json_string_fails(self):
        with pytest.raises((ValidationError, ValueError, Exception)):
            ProjectSpecification.model_validate_json("not-json-at-all")

    # T-PV-08  Wrong type for budget (string instead of float)
    def test_wrong_type_for_budget_fails(self):
        data = json.loads(_full_valid_json())
        data["budget"] = "fifteen thousand"
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-09  confidence_score > 1.0 REJECTED
    def test_confidence_score_above_1_is_rejected(self):
        data = json.loads(_full_valid_json())
        data["metadata"]["confidence_score"] = 9999.0
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-10  confidence_score < 0.0 REJECTED
    def test_confidence_score_below_0_is_rejected(self):
        data = json.loads(_full_valid_json())
        data["metadata"]["confidence_score"] = -0.1
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-11  invalid urgency string REJECTED (enum enforced)
    def test_invalid_urgency_string_rejected(self):
        data = json.loads(_minimal_valid_json())
        data["urgency"] = "ASAP"
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-12  invalid ai_complexity string REJECTED (enum enforced)
    def test_invalid_ai_complexity_string_rejected(self):
        data = json.loads(_full_valid_json())
        data["features"][0]["ai_complexity"] = "extreme"
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-13  complexity_score > 100 REJECTED
    def test_complexity_score_above_100_rejected(self):
        data = json.loads(_full_valid_json())
        data["complexity_score"] = 200
        with pytest.raises(ValidationError):
            ProjectSpecification.model_validate_json(json.dumps(data))

    # T-PV-14  commercial_terms null accepted
    def test_commercial_terms_null_accepted(self):
        data = json.loads(_minimal_valid_json())
        spec = ProjectSpecification.model_validate_json(json.dumps(data))
        assert spec.commercial_terms is None


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 3 — CLIENT REQUEST AGENT (returns ExtractionResult)
# ═══════════════════════════════════════════════════════════════════════════

class TestClientRequestAgent:
    """
    Tests for ClientRequestAgent.extract().

    The agent now ALWAYS returns an ExtractionResult — it never raises.
    Success  → result.success=True,  result.data=ProjectSpecification
    Failure  → result.success=False, result.error=PipelineError
    """

    # T-CA-01  Valid LLM JSON → ExtractionResult with success=True
    def test_valid_llm_response_returns_success_result(self):
        agent = _agent_with_mock_llm(_full_valid_json())
        result = agent.extract("Build a SaaS tool for accountants.")
        assert isinstance(result, ExtractionResult)
        assert result.success is True
        assert isinstance(result.data, ProjectSpecification)
        assert result.data.project_type == "SaaS platform"

    # T-CA-02  Markdown-wrapped JSON → recovery succeeds (Stage 1 strips fences)
    def test_markdown_wrapped_json_is_recovered(self):
        wrapped = f"```json\n{_full_valid_json()}\n```"
        agent = _agent_with_mock_llm(wrapped)
        result = agent.extract("Some request")
        assert isinstance(result, ExtractionResult)
        assert result.success is True, (
            f"Expected recovery to strip markdown fences, got error: {result.error}"
        )

    # T-CA-03  Plain text (no JSON) → ExtractionResult with success=False
    def test_plain_text_llm_response_returns_failure(self):
        agent = _agent_with_mock_llm("Sure! Here is your project plan...")
        result = agent.extract("Build something cool")
        assert isinstance(result, ExtractionResult)
        assert result.success is False
        assert result.error is not None
        assert isinstance(result.error, PipelineError)

    # T-CA-04  Empty LLM response → ExtractionResult with success=False
    def test_empty_llm_response_returns_failure(self):
        agent = _agent_with_mock_llm("")
        result = agent.extract("Build something")
        assert isinstance(result, ExtractionResult)
        assert result.success is False

    # T-CA-05  Partial JSON → Stage 2 repair attempted; result is failure
    def test_partial_json_llm_response_returns_failure(self):
        agent = _agent_with_mock_llm('{"project_type": "web')
        result = agent.extract("Build something")
        assert isinstance(result, ExtractionResult)
        # Stage 2 may not be able to reconstruct missing required fields
        # (urgency is absent from the truncated output) so we expect failure
        assert result.success is False
        assert result.error.recovery_attempted is True

    # T-CA-06  Agent passes correct keyword args to LLM (including request_id)
    def test_agent_passes_correct_args_to_llm(self):
        from django.conf import settings
        agent = ClientRequestAgent.__new__(ClientRequestAgent)
        mock_llm = MagicMock()
        mock_llm.generate.return_value = _full_valid_json()
        agent.llm = mock_llm
        agent.prompt = "EXTRACTION_PROMPT"

        result = agent.extract("Hello world request", request_id="test123")

        # generate must have been called with the right keyword args
        call_kwargs = mock_llm.generate.call_args.kwargs
        assert call_kwargs["input"] == "Hello world request"
        assert call_kwargs["instructions"] == "EXTRACTION_PROMPT"
        assert call_kwargs["temperature"] == settings.O_EXTRACTION_TEMP
        assert call_kwargs["model"] == settings.OPENAI_DEFAULT_MODEL
        assert call_kwargs["request_id"] == "test123"

    # T-CA-07  result.error has correct structure on failure
    def test_failure_result_has_structured_error(self):
        agent = _agent_with_mock_llm("not json at all")
        result = agent.extract("something")
        assert result.success is False
        err = result.error
        assert err.status == "failed"
        assert err.error_type in (
            ErrorType.VALIDATION_ERROR,
            ErrorType.RECOVERY_EXHAUSTED,
            ErrorType.LLM_ERROR,
        )
        assert err.stage is not None
        assert isinstance(err.message, str) and len(err.message) > 0

    # T-CA-08  LLM raises → result is failure (never propagates exception)
    def test_llm_exception_returns_failure_not_exception(self):
        agent = ClientRequestAgent.__new__(ClientRequestAgent)
        mock_llm = MagicMock()
        mock_llm.generate.side_effect = RuntimeError("Connection refused")
        agent.llm = mock_llm
        agent.prompt = "MOCK"

        result = agent.extract("Some request")
        assert isinstance(result, ExtractionResult)
        assert result.success is False
        assert result.error.error_type == ErrorType.LLM_ERROR


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 4 — EDGE CASES
# ═══════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Edge-case inputs through InputProcessor + agent (LLM mocked)."""

    # T-EC-01  Empty string → clean ValueError from InputProcessor
    def test_empty_input_raises_value_error(self):
        with pytest.raises(ValueError):
            InputProcessor.process(text="", file=None)

    # T-EC-02  Garbage / random text passthrough from InputProcessor
    def test_garbage_text_passthrough(self):
        garbage = "asdf random text 123 !!!"
        result = InputProcessor.process(text=garbage)
        assert result == garbage

    # T-EC-03  Ambiguous request text passthrough
    def test_ambiguous_request_passthrough(self):
        ambiguous = "build me something for my business"
        result = InputProcessor.process(text=ambiguous)
        assert result == ambiguous

    # T-EC-04  Complex SaaS request passthrough
    def test_complex_saas_request_passthrough(self):
        complex_req = (
            "We need a SaaS platform with multi-tenant authentication (OAuth2 + JWT), "
            "Stripe subscription billing with plan upgrades, a real-time analytics "
            "dashboard, in-app messaging with WebSocket, AI-powered recommendation "
            "engine, admin panel, role-based access control, and a mobile-responsive UI. "
            "Target audience: SMBs. Timeline: 6 months. Budget: $80,000 USD."
        )
        result = InputProcessor.process(text=complex_req)
        assert result == complex_req

    # T-EC-05  Large multi-paragraph input passthrough
    def test_large_input_passthrough(self):
        large_input = (
            "Project Overview: Build a comprehensive ERP system.\n\n"
            "Module 1 - Inventory Management: Track raw materials.\n\n"
            "Module 2 - Procurement: Vendor management.\n\n"
            "Technical: Cloud on AWS, Django REST, React, PostgreSQL.\n\n"
            "Timeline: 18 months. Budget: $250,000 USD."
        ) * 5
        result = InputProcessor.process(text=large_input)
        # InputProcessor should NOT truncate — sanitization does that
        assert len(result) > 200

    # T-EC-06  Garbage input → agent returns low-confidence failure result
    def test_garbage_input_llm_returns_low_confidence_spec(self):
        garbage_response = json.dumps({
            "project_type": "unknown",
            "urgency": "low",
            "features": [],
            "deliverables": [],
            "technical_requirements": [],
            "integrations": [],
            "platforms": [],
            "metadata": {
                "confidence_score": 0.1,
                "missing_information": ["All information missing"],
                "assumptions_made": ["Input is not a project description"],
            },
            "commercial_terms": None,
        })
        agent = _agent_with_mock_llm(garbage_response)
        result = agent.extract("asdf random text 123 !!!")
        assert result.success is True
        assert result.data.metadata.confidence_score == 0.1


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 5 — API ENDPOINT TESTS
# ═══════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestClientRequestAPIEndpoint:
    """Tests for POST /api/ai/ai-requests/ endpoint."""

    @pytest.fixture(autouse=True)
    def setup(self):
        from django.contrib.auth import get_user_model
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="test@example.com", password="password123"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/ai/ai-requests/"

    def _make_success_result(self):
        """Return a mock ExtractionResult for a successful extraction."""
        mock_spec = MagicMock(spec=ProjectSpecification)
        mock_spec.model_dump.return_value = json.loads(_full_valid_json())
        mock_spec.project_type = "SaaS platform"
        result = MagicMock(spec=ExtractionResult)
        result.success = True
        result.data = mock_spec
        result.error = None
        return result

    def _make_failure_result(self, error_type=ErrorType.LLM_ERROR, stage=Stage.LLM_CALL):
        """Return a mock ExtractionResult for a failed extraction."""
        error = PipelineError(
            error_type=error_type,
            stage=stage,
            message="AI extraction service is temporarily unavailable.",
            recovery_attempted=False,
        )
        result = MagicMock(spec=ExtractionResult)
        result.success = False
        result.data = None
        result.error = error
        return result

    # T-API-01  POST with text → 201 + AIRequest object
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_post_text_returns_201(self, mock_processor, mock_agent_cls):
        mock_processor.process.return_value = "Build me a website."
        mock_agent_cls.return_value.extract.return_value = self._make_success_result()

        resp = self.client.post(
            self.url,
            data={"message": "Build me a website."},
            format="multipart",
        )
        assert resp.status_code == 201, (
            f"FAIL T-API-01: Expected 201, got {resp.status_code}. Body: {resp.data}"
        )
        assert "parsed_output" in resp.data
        assert "raw_input" in resp.data
        assert "status" in resp.data
        assert resp.data["user"] == self.user.id

    # T-API-02  POST with no input → 400
    def test_post_no_input_returns_400(self):
        resp = self.client.post(self.url, data={}, format="multipart")
        assert resp.status_code == 400, (
            f"FAIL T-API-02: Expected 400, got {resp.status_code}"
        )
        assert "error" in resp.data

    # T-API-03  Response includes all AIRequest model fields
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_response_includes_all_model_fields(self, mock_processor, mock_agent_cls):
        mock_processor.process.return_value = "Test request"
        mock_agent_cls.return_value.extract.return_value = self._make_success_result()

        resp = self.client.post(
            self.url,
            data={"message": "Test request"},
            format="multipart",
        )
        assert resp.status_code == 201
        for field in ["id", "raw_input", "parsed_output", "status", "created_at", "user"]:
            assert field in resp.data, f"FAIL T-API-03: Field '{field}' missing from response"

    # T-API-04  status = 'completed' on success
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_status_is_completed_on_success(self, mock_processor, mock_agent_cls):
        mock_processor.process.return_value = "Build something"
        mock_agent_cls.return_value.extract.return_value = self._make_success_result()

        resp = self.client.post(
            self.url,
            data={"message": "Build something"},
            format="multipart",
        )
        assert resp.status_code == 201
        assert resp.data["status"] == "completed"

    # T-API-05  LLM failure → 503 + AIRequest saved as 'failed'
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_llm_failure_returns_503(self, mock_processor, mock_agent_cls):
        from ai.models import AIRequest
        mock_processor.process.return_value = "Some request"
        mock_agent_cls.return_value.extract.return_value = self._make_failure_result(
            error_type=ErrorType.LLM_ERROR,
        )

        resp = self.client.post(
            self.url,
            data={"message": "Some request"},
            format="multipart",
        )
        assert resp.status_code == 503, (
            f"FAIL T-API-05: Expected 503, got {resp.status_code}"
        )
        # Structured error fields must be present
        assert "status" in resp.data
        assert "error_type" in resp.data

        # Verify AIRequest was persisted as failed (was pending first, then updated)
        failed_req = AIRequest.objects.filter(status="failed", user=self.user).first()
        assert failed_req is not None, "FAIL T-API-05: Failed AIRequest not saved to DB"
        assert failed_req.user == self.user
        assert failed_req.error_details is not None

    # T-API-06  GET /api/ai/ai-requests/ → 200 list
    def test_get_list_returns_200(self):
        resp = self.client.get(self.url)
        assert resp.status_code == 200

    # T-API-07  POST with empty string message → 400
    def test_post_empty_message_returns_400(self):
        resp = self.client.post(
            self.url,
            data={"message": ""},
            format="multipart",
        )
        assert resp.status_code == 400
        assert "error" in resp.data

    # T-API-08  Unauthenticated requests are rejected → 401
    def test_unauthenticated_request_returns_401(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get(self.url)
        assert resp.status_code == 401

        resp = self.client.post(self.url, data={"message": "hello"}, format="multipart")
        assert resp.status_code == 401

    # T-API-09  GET is scoped to current user only
    def test_get_list_is_scoped_to_current_user(self):
        from django.contrib.auth import get_user_model
        from ai.models import AIRequest

        other_user = get_user_model().objects.create_user(
            email="other@example.com", password="password123"
        )
        AIRequest.objects.create(user=self.user, raw_input="user request", status="completed")
        AIRequest.objects.create(user=other_user, raw_input="other user request", status="completed")

        resp = self.client.get(self.url)
        assert resp.status_code == 200
        results = resp.data["results"]
        assert len(results) == 1
        assert results[0]["raw_input"] == "user request"

    # T-API-10  AIRequest created as 'pending' before LLM is called
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_pending_record_created_before_llm(self, mock_processor, mock_agent_cls):
        from ai.models import AIRequest

        created_statuses = []

        def capture_and_succeed(*args, **kwargs):
            # At the moment extract() is called, a pending record should exist
            pending = AIRequest.objects.filter(user=self.user, status="pending").first()
            if pending:
                created_statuses.append("pending")
            return self._make_success_result()

        mock_processor.process.return_value = "Build something"
        mock_agent_cls.return_value.extract.side_effect = capture_and_succeed

        resp = self.client.post(
            self.url,
            data={"message": "Build something"},
            format="multipart",
        )
        assert resp.status_code == 201
        assert "pending" in created_statuses, (
            "FAIL T-API-10: No 'pending' AIRequest found during LLM call"
        )
        # After completion, the record should be 'completed', not 'pending'
        assert resp.data["status"] == "completed"

    # T-API-11  PUT/PATCH/DELETE → 405 Method Not Allowed
    def test_put_method_not_allowed(self):
        resp = self.client.put(self.url, data={}, format="json")
        assert resp.status_code == 405

    def test_patch_method_not_allowed(self):
        resp = self.client.patch(self.url, data={}, format="json")
        assert resp.status_code == 405

    def test_delete_method_not_allowed(self):
        resp = self.client.delete(self.url)
        assert resp.status_code == 405

    # T-API-12  Validation failure → 422 + structured error response
    @patch("ai.views.ClientRequestAgent")
    @patch("ai.views.InputProcessor")
    def test_validation_failure_returns_422(self, mock_processor, mock_agent_cls):
        mock_processor.process.return_value = "Some request"
        mock_agent_cls.return_value.extract.return_value = self._make_failure_result(
            error_type=ErrorType.RECOVERY_EXHAUSTED,
            stage=Stage.JSON_REPAIR_STAGE2,
        )

        resp = self.client.post(
            self.url,
            data={"message": "Some request"},
            format="multipart",
        )
        assert resp.status_code == 422
        assert "error_type" in resp.data


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 6 — OPENAI LLM CLASS (unit)
# ═══════════════════════════════════════════════════════════════════════════

class TestOpenAILLMClass:
    """Tests for OpenAILLM without hitting the real API."""

    @patch("ai.services.llm.openai_llm.OpenAI")
    def test_generate_returns_output_text(self, mock_openai_cls):
        mock_response = MagicMock()
        mock_response.output_text = _full_valid_json()
        mock_client = MagicMock()
        mock_client.responses.create.return_value = mock_response
        mock_openai_cls.return_value = mock_client

        from ai.services.llm.openai_llm import OpenAILLM
        service = OpenAILLM()
        result = service.generate(
            input="test input",
            instructions="instructions",
            model="gpt-4o",
            temperature=0.1,
        )
        assert result == _full_valid_json()

    @patch("ai.services.llm.openai_llm.OpenAI")
    def test_openai_error_is_reraised(self, mock_openai_cls):
        from openai import OpenAIError
        mock_client = MagicMock()
        mock_client.responses.create.side_effect = OpenAIError("API error")
        mock_openai_cls.return_value = mock_client

        from ai.services.llm.openai_llm import OpenAILLM
        service = OpenAILLM()
        with pytest.raises(OpenAIError):
            service.generate(
                input="test",
                instructions="prompt",
                model="gpt-4o",
                temperature=0.1,
            )

    @patch("ai.services.llm.openai_llm.OpenAI")
    def test_class_name_is_openai_llm(self, mock_openai_cls):
        """Confirms the class name matches the import in client_request_agent.py."""
        from ai.services.llm import openai_llm
        assert hasattr(openai_llm, "OpenAILLM")

    @patch("ai.services.llm.openai_llm.OpenAI")
    def test_none_output_text_raises_value_error(self, mock_openai_cls):
        """Guard against API returning None for output_text."""
        mock_response = MagicMock()
        mock_response.output_text = None
        mock_client = MagicMock()
        mock_client.responses.create.return_value = mock_response
        mock_openai_cls.return_value = mock_client

        from ai.services.llm.openai_llm import OpenAILLM
        service = OpenAILLM()
        with pytest.raises(ValueError, match="empty"):
            service.generate(
                input="test",
                instructions="prompt",
                model="gpt-4o",
                temperature=0.1,
            )

    @patch("ai.services.llm.openai_llm.OpenAI")
    def test_empty_string_output_text_raises_value_error(self, mock_openai_cls):
        """Guard against API returning empty string for output_text."""
        mock_response = MagicMock()
        mock_response.output_text = ""
        mock_client = MagicMock()
        mock_client.responses.create.return_value = mock_response
        mock_openai_cls.return_value = mock_client

        from ai.services.llm.openai_llm import OpenAILLM
        service = OpenAILLM()
        with pytest.raises(ValueError, match="empty"):
            service.generate(
                input="test",
                instructions="prompt",
                model="gpt-4o",
                temperature=0.1,
            )


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 7 — RECOVERY PIPELINE (JSON repair, no LLM re-call)
# ═══════════════════════════════════════════════════════════════════════════

class TestRecoveryPipeline:
    """Unit tests for attempt_recovery() — Stage 1 and Stage 2 only."""

    from ai.services.recovery import attempt_recovery

    # T-RC-01  Markdown-fenced JSON → Stage 1 strips fences, validates
    def test_stage1_strips_markdown_fences(self):
        from ai.services.recovery import attempt_recovery
        wrapped = f"```json\n{_full_valid_json()}\n```"
        result = attempt_recovery(wrapped)
        assert result.success is True
        assert result.data.project_type == "SaaS platform"

    # T-RC-02  JSON with surrounding prose → Stage 1 extracts object
    def test_stage1_strips_surrounding_prose(self):
        from ai.services.recovery import attempt_recovery
        with_prose = f"Here is the JSON output:\n\n{_full_valid_json()}\n\nLet me know if you need changes."
        result = attempt_recovery(with_prose)
        assert result.success is True

    # T-RC-03  JSON with trailing comma → Stage 1 fixes and validates
    def test_stage1_fixes_trailing_comma(self):
        from ai.services.recovery import attempt_recovery
        data = json.loads(_minimal_valid_json())
        # Manually inject trailing comma
        raw = json.dumps(data)
        # Insert a trailing comma before the last `}`
        broken = raw[:-1] + ',}'
        result = attempt_recovery(broken)
        assert result.success is True

    # T-RC-04  Completely unparseable output → all stages fail, structured error
    def test_all_stages_fail_returns_pipeline_error(self):
        from ai.services.recovery import attempt_recovery
        result = attempt_recovery("This is just a sentence with no JSON whatsoever.")
        assert result.success is False
        assert isinstance(result.error, PipelineError)
        assert result.error.recovery_attempted is True
        assert result.error.error_type == ErrorType.RECOVERY_EXHAUSTED

    # T-RC-05  Valid JSON that fails Pydantic → structured error (missing required fields)
    def test_valid_json_missing_required_fields_returns_failure(self):
        from ai.services.recovery import attempt_recovery
        # Valid JSON but missing required 'project_type' and 'urgency'
        broken = json.dumps({"features": [], "deliverables": []})
        result = attempt_recovery(broken)
        assert result.success is False
        assert result.error.recovery_attempted is True

    # T-RC-06  Empty string → immediate structured failure
    def test_empty_string_returns_failure(self):
        from ai.services.recovery import attempt_recovery
        result = attempt_recovery("")
        assert result.success is False

    # T-RC-07  Minimal valid JSON → passes without needing repair
    def test_already_valid_json_passes_immediately(self):
        from ai.services.recovery import attempt_recovery
        result = attempt_recovery(_minimal_valid_json())
        assert result.success is True

    # T-RC-08  ExtractionResult.ok() and .fail() constructors
    def test_extraction_result_constructors(self):
        spec = ProjectSpecification.model_validate_json(_minimal_valid_json())
        ok_result = ExtractionResult.ok(spec)
        assert ok_result.success is True
        assert ok_result.data is spec
        assert ok_result.error is None

        err = PipelineError(error_type=ErrorType.LLM_ERROR, stage=Stage.LLM_CALL, message="test")
        fail_result = ExtractionResult.fail(err)
        assert fail_result.success is False
        assert fail_result.error is err
        assert fail_result.data is None


# ═══════════════════════════════════════════════════════════════════════════
#  SECTION 8 — SANITIZATION LAYER
# ═══════════════════════════════════════════════════════════════════════════

class TestSanitizationLayer:
    """Unit tests for sanitize_input()."""

    # T-SAN-01  Normal text passes through unchanged (modulo minor whitespace)
    def test_normal_text_passthrough(self):
        from ai.services.sanitization import sanitize_input
        text = "Build me a SaaS app with payments."
        result = sanitize_input(text)
        assert "Build me a SaaS app" in result

    # T-SAN-02  Excessive blank lines collapsed to max 2
    def test_excessive_blank_lines_collapsed(self):
        from ai.services.sanitization import sanitize_input
        text = "Part one.\n\n\n\n\nPart two."
        result = sanitize_input(text)
        assert "\n\n\n" not in result
        assert "Part one." in result
        assert "Part two." in result

    # T-SAN-03  Control characters stripped
    def test_control_characters_stripped(self):
        from ai.services.sanitization import sanitize_input
        text = "Hello\x00World\x01Test"
        result = sanitize_input(text)
        assert "\x00" not in result
        assert "\x01" not in result
        assert "HelloWorldTest" in result

    # T-SAN-04  Input exceeding max chars is truncated with content preserved up to limit
    def test_oversized_input_is_truncated(self):
        from ai.services.sanitization import sanitize_input
        # Generate input well over 50k chars
        text = "A" * 100_000
        result = sanitize_input(text)
        assert len(result) <= 50_000

    # T-SAN-05  Input just under limit passes through fully
    def test_input_under_limit_passes_fully(self):
        from ai.services.sanitization import sanitize_input
        text = "B" * 49_999
        result = sanitize_input(text)
        assert len(result) == 49_999

    # T-SAN-06  Empty string raises ValueError
    def test_empty_string_raises(self):
        from ai.services.sanitization import sanitize_input
        with pytest.raises(ValueError, match="empty"):
            sanitize_input("")

    # T-SAN-07  Whitespace-only input raises ValueError
    def test_whitespace_only_raises(self):
        from ai.services.sanitization import sanitize_input
        with pytest.raises(ValueError):
            sanitize_input("   \n\t  ")

    # T-SAN-08  Input that becomes empty after stripping control chars raises ValueError
    def test_all_control_chars_raises(self):
        from ai.services.sanitization import sanitize_input
        text = "\x00\x01\x02\x03"
        with pytest.raises(ValueError):
            sanitize_input(text)
