# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

### Frontend (Next.js)
```bash
npm run dev      # dev server → http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# API docs → http://localhost:8000/docs
```

### Docker (full stack)
```bash
cp .env.example .env   # fill in ANTHROPIC_API_KEY
docker compose up --build
# App → http://localhost (via Nginx)
```

## Architecture

### Frontend

**Next.js 16 App Router** — all routes live in `app/`. No `pages/` directory. `next.config.ts` sets `output: 'standalone'` (Docker) and `transpilePackages: ['three']` (required for App Router compatibility).

**State** — single Zustand store at `lib/store.ts` (`useAppStore`). Calling `setSelectedStructure()` resets all viewer state atomically: chat history, layer visibility, explode amount, clipping plane, split state.

**Anatomy data** — `lib/anatomyData.ts` is the source of truth. It exports:
- `anatomyTree: AnatomyNode[]` — navigation tree rendered in PanelLeft
- `structures: Record<string, AnatomicalStructure>` — keyed by structure ID; the ID must match the GLB filename in `public/models/`

**3D Viewer** — `components/Viewer3D/`:
- `Viewer3D.tsx` — React Three Fiber `<Canvas>`, toolbar, WASD controls, camera reset watcher, `OrbitControls`
- `ModelLoader.tsx` — loads single-mesh `.glb` with ErrorBoundary
- `LayeredModel.tsx` — loads multi-mesh `.glb`; mesh names in the file must match `AnatomyLayer.id` exactly
- `LayerPanel.tsx` — per-layer visibility toggles (only shown when `selectedStructure.layers` exists)
- `Annotations.tsx` — clickable 3D annotation points from `AnatomicalStructure.annotations`

**AI chat** — `app/api/ask/route.ts` is a Next.js Route Handler that proxies `POST /ask { structure, question }` to the FastAPI backend (timeout 30s). Backend URL: `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:8000`.

### Backend

`backend/main.py` — FastAPI with three endpoints:
- `GET /health` — liveness check
- `GET /structures` — static list of structures (mirrored from `lib/anatomyData.ts`)
- `POST /ask` — delegates to `rag/query.py`

`backend/rag/query.py` — `query_rag(structure, question)`:
1. If `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, tries pgvector search (currently a `TODO` placeholder — always returns `None`)
2. Falls back to direct Claude API (`claude-opus-4-6`, Polish responses, 3–5 sentence answers)

CORS is configured for `http://localhost:3000` and `http://web:3000` (Docker service name).

### Adding a new anatomical structure

1. Add entry to `structures` in `lib/anatomyData.ts` with a unique kebab-case `id`
2. Add leaf node to `anatomyTree` referencing that `structureId`
3. Place `<id>.glb` in `public/models/`
4. If multi-mesh: add `layers: AnatomyLayer[]` to the structure; mesh names in the GLB must match `AnatomyLayer.id` values exactly
5. Mirror the structure in `backend/main.py` `STRUCTURES` list

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API (backend RAG) |
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (enables RAG) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase public key (frontend, if needed) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service key (backend vector search) |
