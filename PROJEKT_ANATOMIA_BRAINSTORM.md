# 🧠 Anatomia 3D — Interaktywna Aplikacja dla Studentów Medycyny
> Podsumowanie ustaleń z sesji brainstorming

---

## 📌 Koncepcja

Interaktywna aplikacja webowa wzorowana na "Cell Architecture Studio", służąca do nauki anatomii człowieka dla studentów medycyny. Baza wiedzy opiera się na książce **"Anatomia człowieka" — Adam Bochenek**. Użytkownik może eksplorować struktury anatomiczne w 3D, klikać na nie i otrzymywać informacje bezpośrednio z treści Bochenka (RAG).

---

## 🎯 Zakresy Tematyczne (MVP)

- **Ośrodkowy Układ Nerwowy (OUN)**
  - Mózgowie (kora mózgowa, móżdżek, pień mózgu, układ limbiczny)
  - Rdzeń kręgowy
  - Nerwy czaszkowe I–XII

- **Układ Krążenia**
  - Serce (komory, przedsionki, zastawki, układ bodźco-przewodzący)
  - Tętnice główne
  - Żyły główne

---

## 🏗️ Stack Technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | Next.js + React |
| 3D Viewer | React Three Fiber + Three.js |
| Backend / RAG | FastAPI |
| Baza danych | Supabase (Cloud) + pgvector |
| AI / LLM | Claude API (RAG query + opisy) |
| OCR Pipeline | PyMuPDF / pdfplumber + Tesseract |
| Deploy | VPS mikr.us + Docker Compose + Nginx |
| SSL | Certbot |

---

## 🎨 Układ UI (3 panele — wzór Cell Architecture Studio)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER — Anatomy Studio | nawigacja główna                 │
├──────────────┬──────────────────────────┬───────────────────┤
│ LEWY PANEL   │   CENTRALNY — Widok 3D   │   PRAWY PANEL     │
│              │                          │                   │
│ Układy       │  [Model 3D rotacyjny]    │  Nazwa PL + LAT   │
│ └ OUN        │                          │  Opis z Bochenka  │
│   └ Mózg     │  Rotate / Isolate        │  Unaczynienie     │
│   └ Rdzeń    │  Cross-Section           │  Unerwienie       │
│ └ Krążenie   │  Hide Others             │  Kliniczne info   │
│   └ Serce    │  Layers toggle           │                   │
│              │                          │  [Zapytaj AI] 🤖  │
├──────────────┴──────────────────────────┴───────────────────┤
│  DOLNY PANEL — Microscope View / Porównaj struktury         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔬 Modele 3D — Źródła

| Źródło | Licencja | Uwagi |
|---|---|---|
| [NIH 3D Print Exchange](https://3d.nih.gov) | Public Domain | Najwyższa jakość medyczna |
| [Embodi3D](https://www.embodi3d.com) | CC BY | Modele z CT/MRI |
| [BodyParts3D](https://lifesciencedb.jp/bp3d/) | CC BY-SA | Kompletna anatomia |
| [Sketchfab](https://sketchfab.com) | CC BY (większość) | Uzupełnienie |

**Format docelowy:** `.glb` (natywna obsługa w Three.js)

---

## 📄 Pipeline OCR — Bochenek

```
PDF Bochenek
    ↓
PyMuPDF / pdfplumber  (tekst z PDF)
    ↓  [jeśli skan]
Tesseract OCR
    ↓
Cleaning (regex + spacy)  → usuwa nagłówki, numery stron, stopki
    ↓
Chunking  → podział według rozdziałów i struktur anatomicznych
    ↓
Embeddingi  → text-embedding-3-small (OpenAI) lub lokalne
    ↓
Supabase pgvector  → vector store
    ↓
Claude API (RAG query)  → odpowiedź w kontekście rozdziału
```

> ⚠️ **Prawo autorskie:** Bochenek to materiał chroniony. Aplikacja wyłącznie prywatna / edukacyjna, nie komercyjna.

---

## 🚀 Unikalne Features

| Feature | Opis |
|---|---|
| **Bochenek RAG** | Każda struktura → odpowiedź z dokładnego rozdziału książki |
| **Animacje fizjologiczne** | Przepływ krwi, potencjał czynnościowy (shader/particles) |
| **Warstwy anatomiczne** | Toggle: skóra → mięśnie → naczynia → nerwy |
| **Tryb egzaminacyjny** | AI ukrywa etykiety, student nazywa struktury |
| **Kliniczne połączenia** | "Co się dzieje przy udarze w tej tętnicy?" |
| **Porównaj struktury** | Side-by-side np. OUN vs obwodowy UN |
| **Notatki studenta** | Highlight + komentarz przypisany do punktu 3D |

---

## 🖥️ Infrastruktura — mikr.us VPS

```yaml
# docker-compose.yml (uproszczony)
services:
  next-app:
    port: 3000

  fastapi-backend:
    port: 8000        # RAG, embeddingi, OCR pipeline

# Supabase → Cloud (free tier)
# Nginx → reverse proxy
# Certbot → SSL
```

---

## 📅 Roadmap

### MVP v0.1 — Fundament
- [ ] Next.js + 3-panelowy layout
- [ ] React Three Fiber — podstawowy viewer (rotacja, zoom)
- [ ] Klikalne punkty (annotations) na modelu
- [ ] Placeholder 3D (gotowy model mózgu z NIH)

### MVP v0.2 — RAG Pipeline
- [ ] OCR skrypt Python na PDF Bochenka
- [ ] Chunking + upload do Supabase pgvector
- [ ] FastAPI endpoint: `POST /ask` z `{ structure, question }`
- [ ] Panel prawy: opis z Bochenka + Claude summary

### MVP v0.3 — Układ Krążenia
- [ ] Model serca z animacją przepływu krwi
- [ ] Warstwy anatomiczne (layers toggle)

### v1.0 — Pełna aplikacja
- [ ] Tryb egzaminacyjny
- [ ] Notatki studenta
- [ ] Deploy na mikr.us (Docker + Nginx + SSL)
- [ ] Oba układy (OUN + Krążenie) kompletne

---

## 📁 Docelowa Struktura Projektu

```
anatomy-studio/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Główna strona
│   ├── layout.tsx
│   └── api/
│       └── ask/route.ts    # Proxy do FastAPI
├── components/
│   ├── Viewer3D/           # React Three Fiber
│   ├── PanelLeft/          # Nawigacja układów
│   ├── PanelRight/         # Szczegóły + AI chat
│   └── PanelBottom/        # Microscope / Compare
├── backend/                # FastAPI
│   ├── main.py
│   ├── rag/
│   │   ├── ocr.py          # OCR pipeline
│   │   ├── chunker.py
│   │   └── query.py        # Vector search + Claude
│   └── models/
├── public/
│   └── models/             # .glb pliki 3D
├── docker-compose.yml
└── PROJEKT_ANATOMIA_BRAINSTORM.md   ← ten plik
```

---

*Dokument wygenerowany podczas sesji brainstorming — maj 2026*
