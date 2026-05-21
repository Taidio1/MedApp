"""
Pipeline OCR dla podręcznika Bochenka.
Placeholder — do zaimplementowania po dostarczeniu pliku PDF.

Pipeline (przyszła implementacja):
    PDF → PyMuPDF/pdfplumber → Tesseract (jeśli skan) →
    regex cleaning → chunking wg rozdziałów →
    text-embedding-3-small → Supabase pgvector
"""


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Ekstrahuje tekst z PDF Bochenka używając PyMuPDF lub Tesseract.

    Raises:
        NotImplementedError: Zawsze — czeka na implementację
    """
    raise NotImplementedError(
        "OCR pipeline nie jest zaimplementowany. "
        "Dostarcz plik PDF Bochenka i zaimplementuj tę funkcję."
    )


def chunk_text(text: str, chunk_size: int = 1000) -> list[str]:
    """
    Dzieli tekst na chunki według rozdziałów i struktur anatomicznych.

    Raises:
        NotImplementedError: Zawsze — czeka na implementację
    """
    raise NotImplementedError("Chunker nie jest zaimplementowany.")


def embed_and_store(chunks: list[str], structure_id: str) -> None:
    """
    Generuje embeddingi i zapisuje do Supabase pgvector.

    Raises:
        NotImplementedError: Zawsze — czeka na implementację
    """
    raise NotImplementedError("Embedding pipeline nie jest zaimplementowany.")
