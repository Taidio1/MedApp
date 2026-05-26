# Anatomy Studio

Interaktywny eksplorator anatomii 3D dla studentów medycyny.  
Wzorowany na stylu Cell Architecture Studio.

## Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS v4
- **3D:** React Three Fiber v9 + @react-three/drei v10
- **Backend:** FastAPI (Python 3.11)
- **AI:** Anthropic Claude API (claude-opus-4-6)
- **Baza danych:** Supabase pgvector (opcjonalna — RAG pipeline)
- **Deploy:** Docker Compose + Nginx

---

## Szybki start (development)

### Wymagania

- Node.js 20+
- Python 3.11+
- npm

### 1. Zainstaluj zależności frontend

```bash
cd MedApp
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

```bash
cp .env.example .env
# Otwórz .env i uzupełnij ANTHROPIC_API_KEY
```

### 3. Uruchom frontend (Next.js)

```bash
npm run dev
# Dostępny pod http://localhost:3000
```

### 4. Uruchom backend FastAPI (osobny terminal)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# Dostępny pod http://localhost:8000
# Dokumentacja API: http://localhost:8000/docs
```

---

## Uruchomienie przez Docker Compose

```bash
# 1. Skopiuj i uzupełnij zmienne środowiskowe
cp .env.example .env

# 2. Zbuduj i uruchom wszystkie serwisy
docker compose up --build

# Aplikacja dostępna pod http://localhost:8080
#
# Jeśli chcesz wystawić ją na innych portach:
# HTTP_PORT=8081 HTTPS_PORT=8444 docker compose up --build
```

### Troubleshooting Docker Compose

Używaj nowszego polecenia `docker compose`, a nie starego `docker-compose`.
Legacy `docker-compose` 1.29.2 może kończyć się błędem `KeyError: 'ContainerConfig'`
przy nowszych wersjach Docker Engine.

```bash
docker compose version
docker compose down --remove-orphans
docker compose up -d --build --force-recreate
```

Jeśli `docker compose version` nie działa, doinstaluj plugin Compose v2 na serwerze.

---

## Dodawanie modeli 3D

1. Pobierz model `.glb` z jednego ze źródeł:
   - [NIH 3D Print Exchange](https://3d.nih.gov) — Public Domain
   - [Embodi3D](https://www.embodi3d.com) — CC BY
   - [BodyParts3D](https://lifesciencedb.jp/bp3d/) — CC BY-SA

2. Nazwij plik według ID struktury:
   - `mozdzek.glb`
   - `kora-mozgowa.glb`
   - `pien-mozgu.glb`
   - `rdzen-kregowy.glb`
   - `serce.glb`
   - `naczynia.glb`

3. Umieść plik w katalogu `public/models/`

4. Model załaduje się automatycznie po wybraniu struktury z panelu lewego.

---

## RAG Pipeline (Bochenek)

Aplikacja jest gotowa do integracji z podręcznikiem Bochenka jako bazą wiedzy.

### Konfiguracja Supabase (opcjonalna)

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Włącz rozszerzenie `pgvector`
3. Uzupełnij zmienne w `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Załadowanie danych z PDF

Po dostarczeniu pliku PDF Bochenka, zaimplementuj pipeline w `backend/rag/`:

1. `ocr.py` → `extract_text_from_pdf()` — ekstrakcja tekstu
2. `ocr.py` → `chunk_text()` — podział na chunki
3. `ocr.py` → `embed_and_store()` — upload do pgvector

Bez Supabase aplikacja odpowiada bezpośrednio przez Claude API.

---

## Struktura projektu

```
MedApp/
├── app/
│   ├── api/ask/route.ts    # Proxy → FastAPI
│   ├── layout.tsx          # Root layout + Inter font
│   └── page.tsx            # 3-panelowy layout
├── components/
│   ├── PanelLeft/          # Drzewo nawigacji anatomicznej
│   ├── Viewer3D/           # React Three Fiber canvas
│   │   ├── Viewer3D.tsx    # Canvas + OrbitControls + WASD + toolbar
│   │   ├── ModelLoader.tsx # Ładowanie .glb z ErrorBoundary
│   │   └── Annotations.tsx # Klikalne punkty 3D
│   ├── PanelRight/         # Szczegóły struktury + chat AI
│   └── PanelBottom/        # Microscope View + Compare
├── lib/
│   ├── types.ts            # TypeScript typy
│   ├── store.ts            # Zustand store
│   └── anatomyData.ts      # Dane anatomiczne (PL + LAT)
├── backend/
│   ├── main.py             # FastAPI — /ask, /structures, /health
│   └── rag/
│       ├── query.py        # RAG + Claude API
│       └── ocr.py          # OCR pipeline (placeholder)
├── public/models/          # Pliki .glb — wgraj tutaj
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

---

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Tak | Klucz do Claude API |
| `NEXT_PUBLIC_API_URL` | Nie | URL backendu (domyślnie: `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Nie | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Nie | Klucz publiczny Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Nie | Klucz serwisowy Supabase (backend) |
