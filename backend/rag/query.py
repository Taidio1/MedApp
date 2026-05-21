"""
Moduł RAG (Retrieval-Augmented Generation).
Wyszukuje odpowiedzi w Supabase pgvector, fallback: Claude bez kontekstu.
"""

import os
from typing import Tuple

import anthropic


async def query_rag(structure: str, question: str) -> Tuple[str, str]:
    """
    Główna funkcja RAG.

    Args:
        structure: ID struktury anatomicznej (np. "mozdzek")
        question: Pytanie użytkownika

    Returns:
        Tuple (odpowiedź AI, źródło informacji)
    """
    context: str | None = None
    source = "Claude API (brak bazy wiedzy Bochenka)"

    # Próba połączenia z Supabase pgvector
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if supabase_url and supabase_key:
        try:
            context = await _search_vector_db(structure, question, supabase_url, supabase_key)
            if context:
                source = "Bochenek — Anatomia człowieka (via pgvector)"
        except Exception as e:
            # Nie blokuj odpowiedzi jeśli Supabase jest niedostępny
            print(f"[RAG] Błąd Supabase: {e}. Używam Claude bez kontekstu.")

    # Budowanie zapytania do Claude
    system_prompt = """Jesteś asystentem medycznym specjalizującym się w anatomii człowieka.
Odpowiadaj zawsze po polsku. Używaj terminologii anatomicznej podając zarówno polską jak i łacińską nazwę (w nawiasie).
Bądź precyzyjny, naukowy i zwięzły. Odpowiadaj w 3-5 zdaniach.
Jeśli nie masz pewności, zaznacz to wyraźnie."""

    user_message = f"Struktura anatomiczna: {structure}\n\nPytanie studenta: {question}"

    if context:
        user_message = (
            f"Kontekst z podręcznika Bochenka:\n{context}\n\n"
            f"Struktura anatomiczna: {structure}\n\n"
            f"Pytanie studenta: {question}\n\n"
            "Odpowiedz na podstawie powyższego kontekstu."
        )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("Brak zmiennej środowiskowej ANTHROPIC_API_KEY")

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    answer = message.content[0].text
    return answer, source


async def _search_vector_db(
    structure: str,
    question: str,
    supabase_url: str,
    supabase_key: str,
) -> str | None:
    """
    Wyszukuje w Supabase pgvector chunki tekstu powiązane z pytaniem.
    Placeholder — wymaga wcześniejszego załadowania embeddingów Bochenka.

    Returns:
        Tekst kontekstu lub None jeśli brak wyników
    """
    # TODO: Implementacja po załadowaniu embeddingów (pipeline OCR → chunking → pgvector)
    return None
