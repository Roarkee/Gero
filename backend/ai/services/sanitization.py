"""
ai/services/sanitization.py
============================
Input sanitization for the LLM extraction pipeline.

Applied to the cleaned text from InputProcessor BEFORE it is sent to
the LLM. Ensures the LLM receives well-formed, reasonably-sized input.

Never raises on sanitisable content — only raises ValueError when
content is fundamentally unusable (empty after cleaning).
"""
from __future__ import annotations

import logging
import re
import unicodedata

from django.conf import settings

logger = logging.getLogger(__name__)

# ─── Configurable constants ──────────────────────────────────────────────────

# Default max characters to send to the LLM (~12 k tokens at 4 chars/token).
# Override via settings.AI_MAX_INPUT_CHARS.
_DEFAULT_MAX_CHARS: int = 50_000

# Characters to strip — null bytes and other non-printable control chars that
# can corrupt JSON or confuse the model.  We keep \t, \n, \r.
_CONTROL_CHAR_RE = re.compile(
    r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]"
)

# Collapse runs of 3+ blank lines into exactly 2.
_BLANK_LINES_RE = re.compile(r"\n{3,}")

# Collapse runs of whitespace on a single line (excluding newlines).
_INLINE_SPACES_RE = re.compile(r"[^\S\n]+")


def sanitize_input(text: str, request_id: str = "") -> str:
    """
    Sanitize raw extracted text before sending to the LLM.

    Steps applied in order:
    1. Strip leading/trailing whitespace.
    2. Remove non-printable control characters (keeps \\t \\n \\r).
    3. Normalize unicode to NFC form.
    4. Collapse excessive blank lines (3+ → 2).
    5. Collapse inline whitespace runs.
    6. Truncate to AI_MAX_INPUT_CHARS if needed (logs a warning).
    7. Guard against empty result after cleaning.

    Parameters
    ----------
    text        : Raw text from InputProcessor.
    request_id  : Optional correlation ID for log messages.

    Returns
    -------
    Sanitized string ready for the LLM.

    Raises
    ------
    ValueError  : If the text is empty or unusable after sanitization.
    """
    ctx = f"[request_id={request_id}] " if request_id else ""

    if not text or not text.strip():
        raise ValueError("Input text is empty or contains only whitespace.")

    # ── 1. Strip outer whitespace
    cleaned = text.strip()

    # ── 2. Remove control characters
    cleaned = _CONTROL_CHAR_RE.sub("", cleaned)

    # ── 3. Unicode NFC normalization
    cleaned = unicodedata.normalize("NFC", cleaned)

    # ── 4. Collapse excessive blank lines
    cleaned = _BLANK_LINES_RE.sub("\n\n", cleaned)

    # ── 5. Collapse inline whitespace
    cleaned = _INLINE_SPACES_RE.sub(" ", cleaned)

    # ── 6. Truncation guard
    max_chars: int = getattr(settings, "AI_MAX_INPUT_CHARS", _DEFAULT_MAX_CHARS)
    original_length = len(cleaned)

    logger.info(
        "%sInput sanitization complete | original_chars=%d",
        ctx,
        original_length,
    )

    if original_length > max_chars:
        cleaned = cleaned[:max_chars]
        logger.warning(
            "%sInput truncated for LLM | original_chars=%d truncated_to=%d",
            ctx,
            original_length,
            max_chars,
        )

    # ── 7. Empty guard (after all processing)
    if not cleaned.strip():
        raise ValueError(
            "Input text was empty after sanitization. "
            "The content may have been entirely non-printable characters."
        )

    return cleaned
