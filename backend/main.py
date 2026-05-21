"""
Anatomy Studio — FastAPI Backend
Endpointy: /ask, /structures, /health
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.query import query_rag

# Ładuj .env jeśli istnieje (lokalne uruchomienie)
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Inicjalizacja aplikacji przy starcie."""
    print("[Anatomy Studio API] Uruchomiono serwer")
    yield
    print("[Anatomy Studio API] Zatrzymano serwer")


app = FastAPI(
    title="Anatomy Studio API",
    description="Backend RAG dla interaktywnego eksploratora anatomii 3D",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — pozwól frontendowi Next.js łączyć się z backendem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://web:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Modele Pydantic =====

class AskRequest(BaseModel):
    structure: str
    question: str


class AskResponse(BaseModel):
    answer: str
    source: str


class StructureInfo(BaseModel):
    id: str
    namePL: str
    nameLAT: str
    system: str


# ===== Dane statyczne (zsynchronizowane z lib/anatomyData.ts) =====

STRUCTURES: list[StructureInfo] = [
    StructureInfo(id="kora-mozgowa", namePL="Kora mózgowa", nameLAT="Cortex cerebri", system="OUN"),
    StructureInfo(id="mozdzek", namePL="Móżdżek", nameLAT="Cerebellum", system="OUN"),
    StructureInfo(id="pien-mozgu", namePL="Pień mózgu", nameLAT="Truncus encephali", system="OUN"),
    StructureInfo(id="rdzen-kregowy", namePL="Rdzeń kręgowy", nameLAT="Medulla spinalis", system="OUN"),
    StructureInfo(id="serce", namePL="Serce", nameLAT="Cor", system="Układ Krążenia"),
    StructureInfo(id="naczynia", namePL="Naczynia krwionośne", nameLAT="Vasa sanguinea", system="Układ Krążenia"),
    StructureInfo(id="lung", namePL="Płuco", nameLAT="Pulmo", system="Układ Oddechowy"),
    StructureInfo(id="stomach", namePL="Żołądek", nameLAT="Gaster", system="Układ Pokarmowy"),
    StructureInfo(id="liver", namePL="Wątroba", nameLAT="Hepar", system="Układ Pokarmowy"),
    StructureInfo(id="kidney", namePL="Nerka", nameLAT="Ren", system="Układ Moczowy"),
]


# ===== Endpointy =====

@app.get("/health")
async def health_check() -> dict[str, str]:
    """Sprawdzenie stanu serwera."""
    return {"status": "ok", "service": "anatomy-studio-api"}


@app.get("/structures", response_model=list[StructureInfo])
async def get_structures() -> list[StructureInfo]:
    """Zwraca listę wszystkich struktur anatomicznych z metadanymi."""
    return STRUCTURES


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest) -> AskResponse:
    """
    Odpowiada na pytanie o strukturę anatomiczną.
    Próbuje Supabase pgvector, fallback: Claude bez kontekstu.
    """
    if not request.structure.strip():
        raise HTTPException(status_code=400, detail="Pole 'structure' nie może być puste")

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Pole 'question' nie może być puste")

    try:
        answer, source = await query_rag(request.structure, request.question)
        return AskResponse(answer=answer, source=source)
    except ValueError as e:
        # Brak klucza API lub błąd konfiguracji
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[/ask] Nieoczekiwany błąd: {e}")
        raise HTTPException(status_code=500, detail="Wewnętrzny błąd serwera")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
