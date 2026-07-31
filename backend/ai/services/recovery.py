"""
ai/services/recovery.py
========================
Local JSON repair pipeline for LLM output failures.

Per user decision: NO secondary LLM re-call.
Recovery is purely local — two stages of increasingly aggressive text
manipulation before concluding that the output cannot be salvaged.

Stage 1 — Syntactic cleaning (fast regex-based):
  • Strip markdown code fences (```json ... ```)
  • Strip prose before/after the JSON object
  • Remove trailing commas before } or ]
  • Replace single-quoted keys/values with double-quoted equivalents
  • Strip JavaScript-style comments

Stage 2 — Structural repair (heuristic):
  • Find the last complete closing brace to handle truncated responses
  • Attempt to close an unclosed JSON object/array

Both stages attempt Pydantic validation after each transformation.
If both stages fail, a structured PipelineError is returned.
"""
from __future__ import annotations

import json
import logging
import re
from typing import TYPE_CHECKING

from pydantic import ValidationError

from .errors import ErrorType, ValidationResult, PipelineError, Stage

if TYPE_CHECKING:
    from ai.schemas.proj_spec_schema import ProjectSpecification

logger = logging.getLogger(__name__)


# ─── Stage 1 helpers ─────────────────────────────────────────────────────────

# Matches markdown code fences: ```json ... ``` or ``` ... ```
_FENCE_RE = re.compile(
    r"```(?:json)?\s*(.*?)\s*```",
    re.DOTALL | re.IGNORECASE,
)

# Trailing comma before a closing brace or bracket: {"a":1,} or [1,2,]
_TRAILING_COMMA_RE = re.compile(r",\s*([\}\]])")

# Single-quoted strings (keys and values) — only safe when there are no
# escaped single quotes inside the string.
_SINGLE_QUOTE_RE = re.compile(r"(?<![\\])'")

# JavaScript // and /* */ comments
_JS_COMMENT_RE = re.compile(r"//.*?$|/\*.*?\*/", re.DOTALL | re.MULTILINE)


def _strip_markdown_fences(text: str) -> str:
    """Extract content from ``` code fences if present."""
    match = _FENCE_RE.search(text)
    if match:
        return match.group(1)
    return text


def _extract_json_object(text: str) -> str:
    """
    Extract the outermost JSON object or array from surrounding prose.

    Finds the first '{' or '[' and the matching last '}' or ']'.
    """
    start_brace = text.find("{")
    start_bracket = text.find("[")

    if start_brace == -1 and start_bracket == -1:
        return text  # no JSON-like structure found — return as-is for later error

    # Use whichever opening delimiter comes first
    if start_brace == -1:
        start = start_bracket
        open_char, close_char = "[", "]"
    elif start_bracket == -1:
        start = start_brace
        open_char, close_char = "{", "}"
    else:
        if start_brace <= start_bracket:
            start = start_brace
            open_char, close_char = "{", "}"
        else:
            start = start_bracket
            open_char, close_char = "[", "]"

    # Walk backwards from end to find matching close
    end = len(text) - 1
    while end >= start and text[end] != close_char:
        end -= 1

    if end < start:
        return text  # couldn't find closing delimiter

    return text[start : end + 1]


def _fix_trailing_commas(text: str) -> str:
    return _TRAILING_COMMA_RE.sub(r"\1", text)


def _fix_single_quotes(text: str) -> str:
    return _SINGLE_QUOTE_RE.sub('"', text)


def _strip_js_comments(text: str) -> str:
    return _JS_COMMENT_RE.sub("", text)


def _stage1_clean(raw: str) -> str:
    """Apply all Stage 1 transformations in a safe order."""
    text = raw

    # 1a. Strip markdown fences
    text = _strip_markdown_fences(text)

    # 1b. Strip surrounding prose
    text = _extract_json_object(text)

    # 1c. Strip JS comments
    text = _strip_js_comments(text)

    # 1d. Fix trailing commas
    text = _fix_trailing_commas(text)

    # 1e. Fix single quotes (careful — only apply if double-quote parse fails)
    # We'll attempt parse first; if it fails we try the single-quote fix

    return text.strip()


# ─── Stage 2 helpers ─────────────────────────────────────────────────────────

def _stage2_repair(text: str) -> str:
    """
    Heuristic structural repair for truncated JSON.

    Strategy:
    1. Find the last position that closes a complete JSON object.
    2. Truncate to that position and attempt parsing.
    3. If the JSON is truncated mid-way, try to close open braces/brackets.
    """
    # First: try to parse as-is to measure how broken it is
    try:
        json.loads(text)
        return text  # already valid
    except json.JSONDecodeError as exc:
        pass

    # Try trimming to the last valid } or ]
    last_brace = text.rfind("}")
    last_bracket = text.rfind("]")
    last_close = max(last_brace, last_bracket)

    if last_close != -1:
        candidate = text[: last_close + 1]
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass

    # Try to close unclosed structures by counting braces/brackets
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")

    # Only attempt this if the imbalance is small (likely truncation, not corruption)
    if 0 < open_braces <= 5 or 0 < open_brackets <= 5:
        # Close any unclosed string first (truncation mid-value)
        repaired = text.rstrip()
        if repaired and repaired[-1] not in ('"', "}", "]", "0123456789"):
            # Likely truncated in the middle of a string — close it
            repaired += '"'

        # Close brackets then braces (innermost first)
        repaired += "]" * max(0, open_brackets)
        repaired += "}" * max(0, open_braces)

        try:
            json.loads(repaired)
            return repaired
        except json.JSONDecodeError:
            pass

    return text  # return unchanged if all repair attempts fail


# ─── Core validation helper ──────────────────────────────────────────────────

def _try_validate(text: str, schema_cls: Any) -> Any | None:
    """
    Attempt Pydantic validation on a JSON string.
    """
    try:
        return schema_cls.model_validate_json(text)
    except (ValidationError, ValueError, Exception):
        return None

# ─── Public entry point ──────────────────────────────────────────────────────

def attempt_recovery(
    raw_output: str,
    schema_cls: Any,
    request_id: str = "",
) -> ValidationResult:
    """
    Attempt local JSON repair on a failed LLM output.
    """
    ctx = f"[request_id={request_id}] " if request_id else ""

    logger.info("%sBeginning recovery pipeline | raw_length=%d", ctx, len(raw_output))

    # ── Stage 1: syntactic cleaning ──────────────────────────────────────────
    logger.debug("%sRecovery Stage 1: syntactic cleaning", ctx)

    stage1_text = _stage1_clean(raw_output)

    # Attempt 1a: after basic cleaning
    spec = _try_validate(stage1_text, schema_cls)
    if spec is not None:
        logger.info("%sRecovery Stage 1a succeeded (basic clean)", ctx)
        return ValidationResult.ok(spec)

    # Attempt 1b: also apply single-quote fix
    stage1b_text = _fix_single_quotes(stage1_text)
    if stage1b_text != stage1_text:
        spec = _try_validate(stage1b_text, schema_cls)
        if spec is not None:
            logger.info("%sRecovery Stage 1b succeeded (single-quote fix)", ctx)
            return ValidationResult.ok(spec)

    logger.debug("%sRecovery Stage 1 failed, proceeding to Stage 2", ctx)

    # ── Stage 2: structural repair ────────────────────────────────────────────
    logger.debug("%sRecovery Stage 2: structural repair", ctx)

    stage2_text = _stage2_repair(stage1b_text if stage1b_text != stage1_text else stage1_text)

    spec = _try_validate(stage2_text, schema_cls)
    if spec is not None:
        logger.info("%sRecovery Stage 2 succeeded (structural repair)", ctx)
        return ValidationResult.ok(spec)

    # ── All stages exhausted ──────────────────────────────────────────────────
    logger.warning(
        "%sAll recovery stages exhausted | raw_length=%d stage1_length=%d stage2_length=%d",
        ctx,
        len(raw_output),
        len(stage1_text),
        len(stage2_text),
    )

    pydantic_details = None
    try:
        schema_cls.model_validate_json(stage2_text)
    except ValidationError as exc:
        pydantic_details = exc.errors()
    except Exception:
        pass

    return ValidationResult.fail(
        PipelineError(
            error_type=ErrorType.RECOVERY_EXHAUSTED,
            stage=Stage.JSON_REPAIR_STAGE2,
            message=(
                "The AI returned a response that could not be parsed or repaired. "
                "Local JSON repair was attempted but the output remains invalid."
            ),
            raw_output=raw_output,
            recovery_attempted=True,
            details={"pydantic_errors": pydantic_details} if pydantic_details else None,
        )
    )
