import logging
import fitz
from docx import Document

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}


class PDFParser:
    """we're extracting plain text from a PDF file using PyMuPDF (fitz)."""

    @staticmethod
    def extract(file) -> str:
        try:
            pdf = fitz.open(stream=file.read(), filetype="pdf")
            text = "".join(page.get_text() for page in pdf)
            pdf.close()
            return text
        except Exception as exc:
            logger.error("PDFParser failed to extract text: %s", exc)
            raise ValueError(f"Could not extract text from PDF: {exc}") from exc


class DOCXParser:

    @staticmethod
    def extract(file) -> str:
        try:
            doc = Document(file)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
            return text
        except Exception as exc:
            logger.error("DOCXParser failed to extract text: %s", exc)
            raise ValueError(f"Could not extract text from DOCX: {exc}") from exc


class InputProcessor:
    """
    we use this function to normalise raw client input (text or file) into clean plain text
    before it is forwarded to the LLM extraction pipeline.
    """

    @staticmethod
    def process(file=None, text: str | None = None) -> str:
        """
        Returns clean plain text regardless of input type.

        """
        if text is not None:
            cleaned = text.strip()
            if not cleaned:
                raise ValueError(
                    "Text input must not be empty. "
                    "Provide a non-blank message or upload a file."
                )
            return cleaned

        if file is None:
            raise ValueError(
                "No input provided. Send either a 'message' field or upload a file."
            )

        filename: str = file.name.lower()

        if filename.endswith(".pdf"):
            return PDFParser.extract(file)

        if filename.endswith(".docx"):
            return DOCXParser.extract(file)

        raise ValueError(
            f"Unsupported file type '{file.name}'. "
            f"Accepted formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )