"""
ai/services/ingestion.py
=========================
Normalises raw client input (text or file) into clean plain text
before it is forwarded to the LLM extraction pipeline.

Hardening additions vs original
---------------------------------
- File size guard (default 10 MB, configurable via settings.AI_MAX_FILE_SIZE_MB).
- Empty extraction guard — raises ValueError if a PDF/DOCX yields no text
  (e.g. scanned/image-only documents).
- Extracted text length is logged for cost monitoring.
"""
from __future__ import annotations

import logging

import fitz
from docx import Document

from django.conf import settings

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}

# Default file size cap (bytes). Override via settings.AI_MAX_FILE_SIZE_MB.
_DEFAULT_MAX_FILE_SIZE_MB: int = 10
_BYTES_PER_MB: int = 1024 * 1024


def _get_max_file_bytes() -> int:
    mb: int = getattr(settings, "AI_MAX_FILE_SIZE_MB", _DEFAULT_MAX_FILE_SIZE_MB)
    return mb * _BYTES_PER_MB


def _check_file_size(file) -> None:
    """
    Raise ValueError if the file exceeds the configured maximum.

    Works with Django InMemoryUploadedFile and TemporaryUploadedFile,
    both of which expose a .size attribute.
    """
    max_bytes = _get_max_file_bytes()
    file_size: int = getattr(file, "size", None)

    if file_size is None:
        # Fallback: seek to end to measure size
        try:
            file.seek(0, 2)
            file_size = file.tell()
            file.seek(0)
        except Exception:
            logger.warning(
                "Could not determine file size for '%s'; proceeding without size check.",
                getattr(file, "name", "unknown"),
            )
            return

    max_mb = getattr(settings, "AI_MAX_FILE_SIZE_MB", _DEFAULT_MAX_FILE_SIZE_MB)
    if file_size > max_bytes:
        raise ValueError(
            f"File '{getattr(file, 'name', 'uploaded')}' is too large "
            f"({file_size / _BYTES_PER_MB:.1f} MB). "
            f"Maximum allowed size is {max_mb} MB."
        )


class PDFParser:
    """Extract plain text from a PDF file using PyMuPDF (fitz)."""

    @staticmethod
    def extract(file) -> str:
        """
        Parameters
        ----------
        file : Django uploaded file object.

        Returns
        -------
        Extracted plain text (may be empty for image-only PDFs —
        the caller is responsible for detecting this).

        Raises
        ------
        ValueError : If the file cannot be read or parsed.
        """
        try:
            pdf = fitz.open(stream=file.read(), filetype="pdf")
            text = "".join(page.get_text() for page in pdf)
            pdf.close()
            return text
        except Exception as exc:
            logger.error("PDFParser failed to extract text: %s", exc)
            raise ValueError(f"Could not extract text from PDF: {exc}") from exc


class DOCXParser:
    """Extract plain text from a DOCX file using python-docx."""

    @staticmethod
    def extract(file) -> str:
        """
        Parameters
        ----------
        file : Django uploaded file object.

        Returns
        -------
        Extracted plain text joined by newlines.

        Raises
        ------
        ValueError : If the file cannot be read or parsed.
        """
        try:
            doc = Document(file)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
            return text
        except Exception as exc:
            logger.error("DOCXParser failed to extract text: %s", exc)
            raise ValueError(f"Could not extract text from DOCX: {exc}") from exc


class InputProcessor:
    """
    Normalises raw client input (text or file) into clean plain text.

    Accepts:
    - Plain text via the ``text`` parameter.
    - PDF or DOCX uploads via the ``file`` parameter.

    Always returns a non-empty string or raises ValueError.
    """

    @staticmethod
    def process(file=None, text: str | None = None) -> str:
        """
        Parameters
        ----------
        file : Optional Django uploaded file (.pdf or .docx).
        text : Optional raw text string.

        Returns
        -------
        Clean plain text ready for the sanitization + LLM pipeline.

        Raises
        ------
        ValueError : On empty input, unsupported format, oversized file,
                     or empty extraction result.
        """
        # ── Text path ────────────────────────────────────────────────────────
        if text is not None:
            cleaned = text.strip()
            if not cleaned:
                raise ValueError(
                    "Text input must not be empty. "
                    "Provide a non-blank message or upload a file."
                )
            logger.debug("InputProcessor: text input | chars=%d", len(cleaned))
            return cleaned

        # ── File path ────────────────────────────────────────────────────────
        if file is None:
            raise ValueError(
                "No input provided. Send either a 'message' field or upload a file."
            )

        # Size guard — before reading any bytes into memory
        _check_file_size(file)

        filename: str = file.name.lower()

        if filename.endswith(".pdf"):
            extracted = PDFParser.extract(file)
        elif filename.endswith(".docx"):
            extracted = DOCXParser.extract(file)
        else:
            raise ValueError(
                f"Unsupported file type '{file.name}'. "
                f"Accepted formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            )

        # Empty extraction guard (e.g. scanned image-only PDFs)
        if not extracted or not extracted.strip():
            raise ValueError(
                f"No readable text could be extracted from '{file.name}'. "
                "The file may be image-based or password-protected. "
                "Please provide a text-based document or paste the content directly."
            )

        logger.info(
            "InputProcessor: file extracted | filename=%s chars=%d",
            file.name,
            len(extracted),
        )
        return extracted