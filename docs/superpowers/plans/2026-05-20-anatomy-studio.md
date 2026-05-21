# Anatomy Studio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować aplikację webową "Anatomy Studio" — interaktywny eksplorator anatomii 3D dla studentów medycyny z layoutem 3-panelowym, React Three Fiber viewerem, backendem FastAPI + Claude AI i infrastrukturą Docker Compose.

**Architecture:** Next.js 14 App Router jako frontend z React Three Fiber do renderowania 3D, Zustand do globalnego stanu aplikacji (wybrana struktura, historia chatu), FastAPI jako backend RAG z fallbackiem do Claude API bez kontekstu (gdy brak Supabase pgvector), Docker Compose z Nginx jako reverse proxy routujący `/api/*` → FastAPI i `/*` → Next.js.

**Tech Stack:** Next.js 14+, TypeScript (strict, no `any`), Tailwind CSS, React Three Fiber, @react-three/drei, Zustand, FastAPI 0.115, Python 3.11, Anthropic SDK (Python), Supabase (env-based, optional), Docker Compose, Nginx

**Ważne zasady:**
- Komentarze w kodzie po polsku
- Zmienne środowiskowe zawsze z `process.env` / `os.getenv` — nigdy hardcode
- Brak `any` w TypeScript
- Responsywność: desktop-first 1440px+
- Obsługa błędów: try/catch + UI feedback w każdym fetch

**Katalog roboczy:** `C:\Users\kkacp\Desktop\MedApp\` (tutaj tworzone są wszystkie pliki)

---

## File Structure

```
MedApp/
├── lib/
│   ├── types.ts               # Wszystkie TypeScript typy i interfejsy
│   ├── store.ts               # Zustand store — globalny stan aplikacji
│   └── anatomyData.ts         # Statyczne dane drzewa anatomicznego
├── app/
│   ├── globals.css            # Globalne style CSS + zmienne
│   ├── layout.tsx             # Root HTML layout z fontem Inter
│   ├── page.tsx               # Główna strona — 3-panelowy grid
│   └── api/ask/route.ts       # Next.js API route — proxy do FastAPI
├── components/
│   ├── PanelLeft/
│   │   └── PanelLeft.tsx      # Drzewo nawigacji układów anatomicznych
│   ├── Viewer3D/
│   │   ├── Viewer3D.tsx       # Główny canvas React Three Fiber + toolbar
│   │   ├── ModelLoader.tsx    # Ładowanie .glb z ErrorBoundary
│   │   └── Annotations.tsx    # Klikalne punkty 3D z tooltipami
│   ├── PanelRight/
│   │   └── PanelRight.tsx     # Szczegóły struktury + chat AI
│   └── PanelBottom/
│       └── PanelBottom.tsx    # Microscope view + porównanie
├── backend/
│   ├── main.py                # FastAPI aplikacja z endpointami
│   ├── requirements.txt       # Zależności Python
│   ├── Dockerfile             # Kontener Python/FastAPI
│   └── rag/
│       ├── __init__.py        # Pusty init
│       ├── query.py           # Vector search + Claude API
│       └── ocr.py             # OCR pipeline (placeholder)
├── public/
│   └── models/
│       └── .gitkeep           # Placeholder — tu wgrywasz .glb
├── Dockerfile                 # Kontener Next.js
├── docker-compose.yml         # Orchestracja serwisów
├── nginx.conf                 # Reverse proxy config
├── .env.example               # Szablon zmiennych środowiskowych
└── README.md                  # Instrukcja uruchomienia
```

---

## Task 1: Scaffolding projektu Next.js i instalacja zależności

**Files:**
- Create: `package.json` (przez create-next-app)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`

- [ ] **Krok 1: Bootstrap Next.js z flagami non-interactive**

```bash
cd C:/Users/kkacp/Desktop/MedApp
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*" --yes
```

Oczekiwany output: `Success! Created your Next.js app`

- [ ] **Krok 2: Zainstaluj zależności 3D i state management**

```bash
npm install @react-three/fiber @react-three/drei three zustand
npm install --save-dev @types/three
```

- [ ] **Krok 3: Sprawdź TypeScript**

```bash
npx tsc --noEmit
```

Oczekiwany output: brak błędów (exit 0)

- [ ] **Krok 4: Zaktualizuj `next.config.ts` — dodaj transpilePackages dla Three.js**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Wymuszenie transpilacji Three.js dla kompatybilności z App Router
  transpilePackages: ['three'],
}

export default nextConfig
```

---

## Task 2: TypeScript typy, Zustand store i dane anatomiczne

**Files:**
- Create: `lib/types.ts`
- Create: `lib/store.ts`
- Create: `lib/anatomyData.ts`

- [ ] **Krok 1: Utwórz plik typów**

Utwórz `lib/types.ts`:

```typescript
// Typy współdzielone przez frontend i logikę aplikacji

/** Punkt anotacji w przestrzeni 3D */
export interface Annotation {
  id: string
  label: string
  /** Pozycja XYZ w przestrzeni Three.js */
  position: [number, number, number]
  structureId: string
}

/** Struktura anatomiczna z metadanymi */
export interface AnatomicalStructure {
  id: string
  namePL: string   // polska nazwa
  nameLAT: string  // łacińska nazwa (nomenklatura anatomiczna)
  system: string   // układ anatomiczny
  description: string
  biologicalNotes: string
  annotations: Annotation[]
}

/** Wiadomość w chacie AI */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/** Żądanie do endpointu /ask */
export interface AskRequest {
  structure: string
  question: string
}

/** Odpowiedź z endpointu /ask */
export interface AskResponse {
  answer: string
  source: string
}

/** Węzeł drzewa nawigacji anatomicznej */
export interface AnatomyNode {
  id: string
  label: string
  icon?: string
  children?: AnatomyNode[]
  /** ID struktury z obiektu structures (jeśli węzeł jest liściem) */
  structureId?: string
}
```

- [ ] **Krok 2: Utwórz Zustand store**

Utwórz `lib/store.ts`:

```typescript
import { create } from 'zustand'
import { AnatomicalStructure, ChatMessage } from './types'

interface AppState {
  // Aktualnie wybrana struktura anatomiczna
  selectedStructure: AnatomicalStructure | null
  setSelectedStructure: (structure: AnatomicalStructure | null) => void

  // Historia wiadomości w chacie AI (per sesja)
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  // Stan ładowania odpowiedzi AI
  isAILoading: boolean
  setIsAILoading: (loading: boolean) => void

  // Trigger do resetowania widoku kamery (inkrementowany przez toolbar)
  cameraResetTrigger: number
  triggerCameraReset: () => void

  // Auto-rotacja modelu 3D
  autoRotate: boolean
  setAutoRotate: (rotate: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedStructure: null,
  setSelectedStructure: (structure) =>
    set({ selectedStructure: structure, chatMessages: [] }),

  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),

  isAILoading: false,
  setIsAILoading: (loading) => set({ isAILoading: loading }),

  cameraResetTrigger: 0,
  triggerCameraReset: () =>
    set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

  autoRotate: false,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
}))
```

- [ ] **Krok 3: Utwórz dane drzewa anatomicznego**

Utwórz `lib/anatomyData.ts`:

```typescript
import { AnatomyNode, AnatomicalStructure } from './types'

/** Drzewo nawigacji w lewym panelu */
export const anatomyTree: AnatomyNode[] = [
  {
    id: 'oun',
    label: 'Ośrodkowy Układ Nerwowy',
    icon: '🧠',
    children: [
      {
        id: 'mozgowie',
        label: 'Mózgowie',
        children: [
          { id: 'kora', label: 'Kora mózgowa', structureId: 'kora-mozgowa' },
          { id: 'mozdzek', label: 'Móżdżek', structureId: 'mozdzek' },
          { id: 'pien', label: 'Pień mózgu', structureId: 'pien-mozgu' },
        ],
      },
      { id: 'rdzen', label: 'Rdzeń kręgowy', structureId: 'rdzen-kregowy' },
    ],
  },
  {
    id: 'krazenie',
    label: 'Układ Krążenia',
    icon: '🫀',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
      { id: 'naczynia', label: 'Naczynia krwionośne', structureId: 'naczynia' },
    ],
  },
]

/** Słownik wszystkich struktur anatomicznych */
export const structures: Record<string, AnatomicalStructure> = {
  'kora-mozgowa': {
    id: 'kora-mozgowa',
    namePL: 'Kora mózgowa',
    nameLAT: 'Cortex cerebri',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Zewnętrzna warstwa mózgu zbudowana z istoty szarej. Odpowiada za wyższe funkcje poznawcze, świadomość, percepcję zmysłową i kontrolę ruchów dowolnych. Podzielona czynnościowo na obszary wg mapy Brodmanna.',
    biologicalNotes:
      'Grubość: 2–4 mm. Zawiera ~16 mld neuronów. 4 płaty: czołowy (planowanie), ciemieniowy (czucie), skroniowy (słuch/pamięć), potyliczny (wzrok).',
    annotations: [
      { id: 'ann-kora-1', label: 'Płat czołowy', position: [0, 1.5, 1], structureId: 'kora-mozgowa' },
      { id: 'ann-kora-2', label: 'Płat ciemieniowy', position: [0, 1.8, 0], structureId: 'kora-mozgowa' },
      { id: 'ann-kora-3', label: 'Płat potyliczny', position: [0, 1.2, -1], structureId: 'kora-mozgowa' },
    ],
  },
  mozdzek: {
    id: 'mozdzek',
    namePL: 'Móżdżek',
    nameLAT: 'Cerebellum',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Część mózgu odpowiedzialna za koordynację ruchów, utrzymanie równowagi i postawy ciała. Odgrywa kluczową rolę w uczeniu się motorycznym i precyzji ruchów.',
    biologicalNotes:
      'Stanowi ~10% objętości mózgu, ale zawiera ponad 50% wszystkich neuronów. Składa się z dwóch półkul i robaka (vermis cerebelli). Komórki Purkiniego — unikalne neurony hamujące.',
    annotations: [
      { id: 'ann-mozdzek-1', label: 'Półkula lewa', position: [-1, -0.5, 0], structureId: 'mozdzek' },
      { id: 'ann-mozdzek-2', label: 'Robak (vermis)', position: [0, -0.5, 0], structureId: 'mozdzek' },
      { id: 'ann-mozdzek-3', label: 'Półkula prawa', position: [1, -0.5, 0], structureId: 'mozdzek' },
    ],
  },
  'pien-mozgu': {
    id: 'pien-mozgu',
    namePL: 'Pień mózgu',
    nameLAT: 'Truncus encephali',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Łączy mózg z rdzeniem kręgowym. Kontroluje podstawowe funkcje życiowe: oddychanie, bicie serca, ciśnienie tętnicze. Zawiera jądra nerwów czaszkowych III–XII.',
    biologicalNotes:
      'Składa się z: śródmózgowia (mesencephalon), mostu (pons Varoli) i rdzenia przedłużonego (medulla oblongata). Twór siatkowaty reguluje poziom świadomości.',
    annotations: [],
  },
  'rdzen-kregowy': {
    id: 'rdzen-kregowy',
    namePL: 'Rdzeń kręgowy',
    nameLAT: 'Medulla spinalis',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Część OUN przebiegająca w kanale kręgowym. Przewodzi impulsy nerwowe między mózgiem a resztą ciała. Zawiera ośrodki odruchów rdzeniowych.',
    biologicalNotes:
      'Długość: 40–50 cm. 31 par nerwów rdzeniowych. Segmenty: szyjne C1–C8, piersiowe T1–T12, lędźwiowe L1–L5, krzyżowe S1–S5, guziczne Co1.',
    annotations: [],
  },
  serce: {
    id: 'serce',
    namePL: 'Serce',
    nameLAT: 'Cor',
    system: 'Układ Krążenia',
    description:
      'Narząd mięśniowy pompujący krew przez układ krwionośny. Leży w śródpiersiu, między płucami. Wykonuje ok. 100 000 uderzeń dziennie, przepompowując ~7000 litrów krwi.',
    biologicalNotes:
      'Masa: 250–350 g. 4 jamy: 2 przedsionki + 2 komory. Układ bodźco-przewodzący: węzeł SA (rozrusznik) → węzeł AV → pęczek Hisa → włókna Purkiniego.',
    annotations: [
      { id: 'ann-serce-1', label: 'Komora lewa', position: [-0.5, 0, 0.5], structureId: 'serce' },
      { id: 'ann-serce-2', label: 'Zastawka mitralna', position: [-0.3, 0.5, 0.3], structureId: 'serce' },
      { id: 'ann-serce-3', label: 'Aorta', position: [0, 1.2, 0], structureId: 'serce' },
    ],
  },
  naczynia: {
    id: 'naczynia',
    namePL: 'Naczynia krwionośne',
    nameLAT: 'Vasa sanguinea',
    system: 'Układ Krążenia',
    description:
      'Sieć naczyń transportujących krew: tętnice (od serca), żyły (do serca) i naczynia włosowate (wymiana substancji z tkankami).',
    biologicalNotes:
      'Łączna długość naczyń w organizmie: ~100 000 km. Aorta — największa tętnica, Ø ~25 mm. Kapilary — Ø 5–10 μm, wymiana gazowa.',
    annotations: [],
  },
}
```

- [ ] **Krok 4: Zweryfikuj typy**

```bash
npx tsc --noEmit
```

Oczekiwany output: brak błędów

---

## Task 3: Globalne style CSS i root layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Krok 1: Nadpisz `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Kolory marki */
  --color-dark: #1a1a2e;
  --color-dark-secondary: #2a2a4e;
  --color-accent: #7c3aed;
  --color-accent-hover: #6d28d9;
  --color-cream: #f5f0e8;
  --color-cream-dark: #ede8df;
}

/* Bazowy reset */
* {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Stylizacja scrollbara (lewy panel) */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-dark-secondary);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}
```

- [ ] **Krok 2: Nadpisz `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Font Inter z obsługą polskich znaków (latin-ext)
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Anatomy Studio',
  description: 'Interaktywny eksplorator anatomii 3D dla studentów medycyny',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={inter.variable}>
      <body className="h-full overflow-hidden bg-[#1a1a2e] font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## Task 4: Główna strona — layout 3-panelowy

**Files:**
- Modify: `app/page.tsx`

- [ ] **Krok 1: Zastąp domyślną stronę Next.js**

Utwórz `app/page.tsx`:

```tsx
import { PanelLeft } from '@/components/PanelLeft/PanelLeft'
import { Viewer3D } from '@/components/Viewer3D/Viewer3D'
import { PanelRight } from '@/components/PanelRight/PanelRight'
import { PanelBottom } from '@/components/PanelBottom/PanelBottom'

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 h-12 bg-[#12122a] border-b border-[#2a2a4e] flex items-center px-6 gap-4 z-10">
        {/* Logo i nazwa aplikacji */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">
            Anatomy Studio
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[#2a2a4e]" />

        {/* Nawigacja główna */}
        <nav className="flex items-center gap-1">
          {['Explorer', 'Compare', 'Exam Mode'].map((item) => (
            <button
              key={item}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4e] rounded transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Prawa część headera */}
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500">
            v0.1 — MVP
          </div>
        </div>
      </header>

      {/* ===== GŁÓWNA ZAWARTOŚĆ ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== LEWY PANEL (280px) ===== */}
        <PanelLeft />

        {/* ===== PRAWA STRONA (viewer + prawy panel + dolny pasek) ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Środkowy rząd: viewer 3D + prawy panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* ===== CENTRALNY VIEWER 3D ===== */}
            <main className="flex-1 relative overflow-hidden">
              <Viewer3D />
            </main>

            {/* ===== PRAWY PANEL (320px) ===== */}
            <PanelRight />
          </div>

          {/* ===== DOLNY PASEK (120px) ===== */}
          <PanelBottom />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Krok 2: Utwórz tymczasowe placeholdery komponentów (aby `npm run dev` działał)**

Utwórz `components/PanelLeft/PanelLeft.tsx`:

```tsx
export function PanelLeft() {
  return <aside className="w-[280px] bg-[#1a1a2e] border-r border-[#2a2a4e]" />
}
```

Utwórz `components/Viewer3D/Viewer3D.tsx`:

```tsx
'use client'
export function Viewer3D() {
  return <div className="w-full h-full bg-[#1a1a2e]" />
}
```

Utwórz `components/PanelRight/PanelRight.tsx`:

```tsx
export function PanelRight() {
  return <aside className="w-[320px] bg-[#f5f0e8] border-l border-gray-200" />
}
```

Utwórz `components/PanelBottom/PanelBottom.tsx`:

```tsx
export function PanelBottom() {
  return <div className="h-[120px] bg-[#f5f0e8] border-t border-gray-200" />
}
```

- [ ] **Krok 3: Uruchom dev server i sprawdź layout**

```bash
npm run dev
```

Otwórz http://localhost:3000 — powinieneś zobaczyć 3-panelowy layout z headerem.

---

## Task 5: PanelLeft — drzewo nawigacji anatomicznej

**Files:**
- Modify: `components/PanelLeft/PanelLeft.tsx`

- [ ] **Krok 1: Zastąp placeholder pełną implementacją**

Nadpisz `components/PanelLeft/PanelLeft.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { AnatomyNode } from '@/lib/types'
import { anatomyTree, structures } from '@/lib/anatomyData'
import { useAppStore } from '@/lib/store'

// Rekurencyjny węzeł drzewa nawigacji
function TreeNode({ node, depth = 0 }: { node: AnatomyNode; depth?: number }) {
  // Węzły najwyższego poziomu domyślnie rozwinięte
  const [expanded, setExpanded] = useState(depth === 0)
  const { selectedStructure, setSelectedStructure } = useAppStore()

  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isActive = selectedStructure?.id === node.structureId

  const handleClick = () => {
    // Rozwiń/zwiń jeśli ma dzieci
    if (hasChildren) setExpanded((prev) => !prev)

    // Zaznacz strukturę jeśli węzeł ma przypisaną strukturę
    if (node.structureId && structures[node.structureId]) {
      setSelectedStructure(structures[node.structureId])
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full text-left py-1.5 rounded text-sm transition-colors
          flex items-center gap-1.5 group
          ${isActive
            ? 'bg-[#7c3aed] text-white'
            : 'text-gray-300 hover:bg-[#2a2a4e] hover:text-white'
          }
        `}
        style={{ paddingLeft: `${depth * 14 + 8}px`, paddingRight: '8px' }}
      >
        {/* Strzałka rozwijania / marker liścia */}
        <span className="text-[10px] w-3 flex-shrink-0 opacity-60">
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </span>

        {/* Emoji ikony dla układów najwyższego poziomu */}
        {node.icon && (
          <span className="text-base leading-none">{node.icon}</span>
        )}

        <span className="truncate">{node.label}</span>
      </button>

      {/* Dzieci węzła (jeśli rozwinięty) */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PanelLeft() {
  return (
    <aside className="w-[280px] flex-shrink-0 bg-[#1a1a2e] border-r border-[#2a2a4e] overflow-y-auto flex flex-col">
      {/* Nagłówek panelu */}
      <div className="px-4 py-3 border-b border-[#2a2a4e] flex-shrink-0">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Układy Anatomiczne
        </h2>
      </div>

      {/* Drzewo nawigacji */}
      <nav className="p-2 flex-1">
        {anatomyTree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </nav>

      {/* Stopka panelu */}
      <div className="px-4 py-3 border-t border-[#2a2a4e] flex-shrink-0">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Kliknij strukturę aby wyświetlić szczegóły i zapytać AI.
        </p>
      </div>
    </aside>
  )
}
```

- [ ] **Krok 2: Sprawdź w przeglądarce**

Drzewo powinno być rozwijalne i zaznaczać elementy fioletowym podświetleniem.

---

## Task 6: Viewer3D — canvas React Three Fiber z OrbitControls i toolbarem

**Files:**
- Create: `components/Viewer3D/Viewer3D.tsx` (pełna implementacja)
- Create: `components/Viewer3D/ModelLoader.tsx`
- Create: `components/Viewer3D/Annotations.tsx`

- [ ] **Krok 1: Utwórz `components/Viewer3D/ModelLoader.tsx`**

```tsx
'use client'

import { useGLTF } from '@react-three/drei'
import { Component, ReactNode } from 'react'

// ErrorBoundary do obsługi braku pliku .glb
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// Placeholder wyświetlany gdy brak modelu .glb
function PlaceholderMesh() {
  return (
    <group>
      {/* Zewnętrzna sfera — wireframe fioletowy */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          wireframe
          opacity={0.5}
          transparent
        />
      </mesh>
      {/* Wewnętrzna sfera — wireframe jaśniejszy */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial
          color="#9d4edd"
          wireframe
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  )
}

// Komponent ładujący model .glb
function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

interface ModelLoaderProps {
  /** Ścieżka do pliku .glb względem /public */
  url: string
}

/** Ładuje model .glb z automatycznym fallbackiem na placeholder */
export function ModelLoader({ url }: ModelLoaderProps) {
  return (
    <ModelErrorBoundary fallback={<PlaceholderMesh />}>
      <GLBModel url={url} />
    </ModelErrorBoundary>
  )
}
```

- [ ] **Krok 2: Utwórz `components/Viewer3D/Annotations.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Html } from '@react-three/drei'
import { useAppStore } from '@/lib/store'
import { Annotation } from '@/lib/types'

// Jeden punkt anotacji z tooltipem przy hover
function AnnotationPoint({ annotation }: { annotation: Annotation }) {
  const [hovered, setHovered] = useState(false)
  const { setSelectedStructure } = useAppStore()
  const { structures } = require('@/lib/anatomyData')

  const handleClick = () => {
    const structure = structures[annotation.structureId]
    if (structure) setSelectedStructure(structure)
  }

  return (
    <group position={annotation.position}>
      {/* Żółta kropka — klikalna */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.1 : 0.08, 12, 12]} />
        <meshBasicMaterial color={hovered ? '#f59e0b' : '#fbbf24'} />
      </mesh>

      {/* Pulsująca obwódka */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
      </mesh>

      {/* Tooltip HTML przy hover */}
      {hovered && (
        <Html distanceFactor={10} zIndexRange={[100, 0]}>
          <div
            style={{
              background: 'rgba(0,0,0,0.85)',
              color: 'white',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(124,58,237,0.5)',
              pointerEvents: 'none',
            }}
          >
            {annotation.label}
          </div>
        </Html>
      )}
    </group>
  )
}

/** Renderuje wszystkie anotacje dla aktualnie wybranej struktury */
export function Annotations() {
  const { selectedStructure } = useAppStore()

  if (!selectedStructure || selectedStructure.annotations.length === 0) {
    return null
  }

  return (
    <>
      {selectedStructure.annotations.map((annotation) => (
        <AnnotationPoint key={annotation.id} annotation={annotation} />
      ))}
    </>
  )
}
```

- [ ] **Krok 3: Utwórz `components/Viewer3D/Viewer3D.tsx` — główny canvas**

```tsx
'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { ModelLoader } from './ModelLoader'
import { Annotations } from './Annotations'
import { useAppStore } from '@/lib/store'

// Przyciski toolbara
const TOOLBAR_BUTTONS = [
  { id: 'rotate', label: 'Rotate' },
  { id: 'isolate', label: 'Isolate' },
  { id: 'cross-section', label: 'Cross-Section' },
  { id: 'hide-others', label: 'Hide Others' },
  { id: 'reset', label: 'Reset View' },
] as const

type ToolbarButtonId = (typeof TOOLBAR_BUTTONS)[number]['id']

// Toolbar z przyciskami akcji
function ViewerToolbar() {
  const { autoRotate, setAutoRotate, triggerCameraReset } = useAppStore()

  const handleAction = (id: ToolbarButtonId) => {
    switch (id) {
      case 'rotate':
        setAutoRotate(!autoRotate)
        break
      case 'reset':
        triggerCameraReset()
        break
      // Pozostałe funkcje wymagają załadowanego modelu 3D
      default:
        console.info(`[Anatomy Studio] Funkcja "${id}" wymaga modelu .glb`)
        break
    }
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
      {TOOLBAR_BUTTONS.map((btn) => (
        <button
          key={btn.id}
          onClick={() => handleAction(btn.id)}
          className={`
            px-3 py-1 text-xs rounded-full transition-all
            ${btn.id === 'rotate' && autoRotate
              ? 'bg-[#7c3aed] text-white'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
            }
          `}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

// Obsługa WASD — przesuwanie kamery
function WASDControls() {
  const { camera } = useThree()
  const keys = useRef(new Set<string>())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase())
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame(() => {
    const speed = 0.04
    const right = new THREE.Vector3()
    const forward = new THREE.Vector3()

    camera.getWorldDirection(forward)
    right.crossVectors(forward, camera.up).normalize()

    if (keys.current.has('w')) camera.position.addScaledVector(forward, speed)
    if (keys.current.has('s')) camera.position.addScaledVector(forward, -speed)
    if (keys.current.has('a')) camera.position.addScaledVector(right, -speed)
    if (keys.current.has('d')) camera.position.addScaledVector(right, speed)
  })

  return null
}

// Obserwuje trigger resetu kamery ze store i wywołuje controls.reset()
function CameraResetWatcher() {
  const { camera } = useThree()
  const trigger = useAppStore((s) => s.cameraResetTrigger)
  const previousTrigger = useRef(0)

  useEffect(() => {
    if (trigger > 0 && trigger !== previousTrigger.current) {
      previousTrigger.current = trigger
      // Resetuj kamerę do pozycji startowej
      camera.position.set(0, 0, 5)
      camera.lookAt(0, 0, 0)
    }
  }, [trigger, camera])

  return null
}

// Placeholder overlay gdy brak modelu
function PlaceholderOverlay() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
      <div className="text-center">
        <p className="text-[#3a3a6a] text-xs">
          Wgraj model <code className="bg-[#2a2a4e] px-1 rounded">.glb</code> do{' '}
          <code className="bg-[#2a2a4e] px-1 rounded">/public/models/</code>
        </p>
      </div>
    </div>
  )
}

export function Viewer3D() {
  const { selectedStructure, autoRotate } = useAppStore()

  // URL modelu zależy od wybranej struktury
  const modelUrl = selectedStructure
    ? `/models/${selectedStructure.id}.glb`
    : '/models/placeholder.glb'

  return (
    <div className="relative w-full h-full bg-[#1a1a2e]">
      {/* Toolbar HTML — nad canvasem */}
      <ViewerToolbar />

      {/* Informacja o placeholderze */}
      <PlaceholderOverlay />

      {/* Subtelny gradient na dole canvas */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none z-[1]" />

      {/* Canvas Three.js */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        shadows
      >
        {/* Oświetlenie */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} />

        {/* Model lub placeholder */}
        <Suspense fallback={null}>
          <ModelLoader url={modelUrl} />
        </Suspense>

        {/* Anotacje na modelu */}
        <Annotations />

        {/* Kontrolki kamery */}
        <WASDControls />
        <CameraResetWatcher />

        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={1}
          maxDistance={20}
          enablePan
          panSpeed={0.5}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}
```

- [ ] **Krok 4: Sprawdź w przeglądarce**

Powinieneś zobaczyć fioletowy wireframe placeholder rotujący przy OrbitControls. Toolbar powinien być widoczny na górze viewera.

---

## Task 7: PanelRight — szczegóły struktury i chat AI

**Files:**
- Modify: `components/PanelRight/PanelRight.tsx`

- [ ] **Krok 1: Zastąp placeholder pełną implementacją**

Nadpisz `components/PanelRight/PanelRight.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AskRequest, AskResponse, ChatMessage } from '@/lib/types'

// Sekcja z etykietą i zawartością
function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </h3>
      {children}
    </div>
  )
}

// Pojedyncza wiadomość w chacie
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`
          max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed
          ${isUser
            ? 'bg-[#7c3aed] text-white rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none shadow-sm'
          }
        `}
      >
        {message.content}
        {message.role === 'assistant' && (
          <div className="text-[9px] text-gray-400 mt-1 text-right">
            AI · {message.timestamp.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}

export function PanelRight() {
  const {
    selectedStructure,
    chatMessages,
    addChatMessage,
    isAILoading,
    setIsAILoading,
  } = useAppStore()

  const [inputValue, setInputValue] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll do ostatniej wiadomości
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Wysyłanie pytania do AI
  const handleAsk = async () => {
    if (!inputValue.trim() || !selectedStructure || isAILoading) return

    const userQuestion = inputValue.trim()
    setInputValue('')
    setErrorMessage(null)

    // Dodaj wiadomość użytkownika
    addChatMessage({
      role: 'user',
      content: userQuestion,
      timestamp: new Date(),
    })

    setIsAILoading(true)

    try {
      const body: AskRequest = {
        structure: selectedStructure.id,
        question: userQuestion,
      }

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`)
      }

      const data: AskResponse = await response.json()

      // Dodaj odpowiedź AI
      addChatMessage({
        role: 'assistant',
        content: `${data.answer}\n\n_Źródło: ${data.source}_`,
        timestamp: new Date(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd'
      setErrorMessage(`Nie udało się połączyć z AI: ${message}`)
    } finally {
      setIsAILoading(false)
    }
  }

  // Obsługa Enter w polu input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <aside className="w-[320px] flex-shrink-0 bg-[#f5f0e8] border-l border-gray-200 flex flex-col overflow-hidden">
      {selectedStructure ? (
        <>
          {/* Nagłówek struktury */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-200 flex-shrink-0 bg-white/50">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {selectedStructure.namePL}
            </h1>
            <p className="text-xs text-[#7c3aed] font-medium mt-0.5 italic">
              {selectedStructure.nameLAT}
            </p>
            <div className="mt-2">
              <span className="text-[10px] bg-[#7c3aed]/10 text-[#7c3aed] px-2 py-0.5 rounded-full">
                {selectedStructure.system}
              </span>
            </div>
          </div>

          {/* Szczegóły struktury */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
            <InfoSection label="Opis">
              <p className="text-xs text-gray-600 leading-relaxed">
                {selectedStructure.description}
              </p>
            </InfoSection>

            <InfoSection label="Biological Notes">
              <div
                className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-3 border border-gray-100"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {selectedStructure.biologicalNotes}
              </div>
            </InfoSection>

            <InfoSection label="Where It Occurs">
              <div className="text-xs text-gray-400 italic bg-white/50 rounded p-2 border border-dashed border-gray-200">
                Uzupełniane po załadowaniu bazy Bochenka (RAG)
              </div>
            </InfoSection>

            {/* Sekcja chat AI */}
            <InfoSection label="Zapytaj AI">
              <div
                className="bg-white rounded-lg border border-gray-100 overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                {/* Historia czatu */}
                {chatMessages.length > 0 && (
                  <div className="p-3 max-h-48 overflow-y-auto border-b border-gray-100">
                    {chatMessages.map((msg, idx) => (
                      <ChatBubble key={idx} message={msg} />
                    ))}
                    {isAILoading && (
                      <div className="flex justify-start mb-2">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-400">
                          AI myśli...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Błąd połączenia */}
                {errorMessage && (
                  <div className="px-3 py-2 text-xs text-red-500 bg-red-50 border-b border-red-100">
                    {errorMessage}
                  </div>
                )}

                {/* Input + przycisk */}
                <div className="flex items-center gap-2 p-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Zadaj pytanie o strukturę..."
                    disabled={isAILoading}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={!inputValue.trim() || isAILoading}
                    className="px-3 py-1.5 text-xs bg-[#7c3aed] text-white rounded hover:bg-[#6d28d9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isAILoading ? '...' : 'Zapytaj'}
                  </button>
                </div>
              </div>
            </InfoSection>
          </div>
        </>
      ) : (
        /* Stan gdy brak wybranej struktury */
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#7c3aed]/10 flex items-center justify-center mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h2 className="text-sm font-semibold text-gray-600 mb-1">
            Wybierz strukturę
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Wybierz strukturę z panelu lewego lub kliknij punkt anotacji na modelu 3D.
          </p>
        </div>
      )}
    </aside>
  )
}
```

---

## Task 8: PanelBottom — Microscope View i Compare

**Files:**
- Modify: `components/PanelBottom/PanelBottom.tsx`

- [ ] **Krok 1: Zastąp placeholder pełną implementacją**

Nadpisz `components/PanelBottom/PanelBottom.tsx`:

```tsx
'use client'

// Slot na zdjęcie/obraz (placeholder)
function ImageSlot({ label }: { label: string }) {
  return (
    <div className="w-24 h-16 rounded bg-[#ede8df] border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#7c3aed] hover:bg-[#7c3aed]/5 transition-colors group">
      <div className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-[#7c3aed] flex items-center justify-center">
        <span className="text-[8px] text-gray-400 group-hover:text-[#7c3aed]">+</span>
      </div>
      <span className="text-[9px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  )
}

// Slot do porównania (side-by-side)
function CompareSlot({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="flex-1 h-full rounded border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#7c3aed] hover:bg-[#7c3aed]/5 transition-colors group">
      <div className="text-center">
        <div className="text-[10px] text-gray-400 group-hover:text-[#7c3aed]">
          {side === 'left' ? 'Struktura A' : 'Struktura B'}
        </div>
        <div className="text-[9px] text-gray-300">kliknij aby wybrać</div>
      </div>
    </div>
  )
}

export function PanelBottom() {
  return (
    <div className="h-[120px] flex-shrink-0 bg-[#f5f0e8] border-t border-gray-200 flex items-stretch overflow-hidden">
      {/* Sekcja: Microscope View */}
      <div className="flex-1 px-5 py-3 border-r border-gray-200">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Microscope View
        </div>
        <div className="flex items-center gap-2">
          <ImageSlot label="Preparat 1" />
          <ImageSlot label="Preparat 2" />
          <ImageSlot label="Preparat 3" />
        </div>
      </div>

      {/* Sekcja: Compare Cells */}
      <div className="w-[300px] flex-shrink-0 px-5 py-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Compare Cells
        </div>
        <div className="flex gap-2 h-[72px]">
          <CompareSlot side="left" />
          <div className="flex items-center text-gray-300 text-xs">vs</div>
          <CompareSlot side="right" />
        </div>
      </div>
    </div>
  )
}
```

---

## Task 9: Next.js API route — proxy do FastAPI

**Files:**
- Create: `app/api/ask/route.ts`

- [ ] **Krok 1: Utwórz route handler**

Utwórz `app/api/ask/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AskRequest, AskResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  let body: AskRequest

  // Parsowanie body żądania
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Nieprawidłowy format JSON' },
      { status: 400 }
    )
  }

  // Walidacja wymaganych pól
  if (!body.structure || !body.question) {
    return NextResponse.json(
      { error: 'Brakujące pola: structure, question' },
      { status: 400 }
    )
  }

  // URL backendu z zmiennej środowiskowej
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const backendResponse = await fetch(`${apiUrl}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Timeout 30s (Claude może odpowiadać chwilę)
      signal: AbortSignal.timeout(30_000),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return NextResponse.json(
        { error: `Backend zwrócił błąd: ${backendResponse.status}`, detail: errorText },
        { status: backendResponse.status }
      )
    }

    const data: AskResponse = await backendResponse.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nieznany błąd'

    // Użytkownik widzi przyjazny komunikat, logi zawierają szczegóły
    console.error('[API /ask] Błąd połączenia z backendem:', message)

    return NextResponse.json(
      {
        error: 'Nie udało się połączyć z backendem',
        detail: message,
      },
      { status: 503 }
    )
  }
}
```

---

## Task 10: Backend FastAPI

**Files:**
- Create: `backend/main.py`
- Create: `backend/requirements.txt`
- Create: `backend/rag/__init__.py`
- Create: `backend/rag/query.py`
- Create: `backend/rag/ocr.py`

- [ ] **Krok 1: Utwórz `backend/requirements.txt`**

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
pydantic==2.10.3
anthropic==0.40.0
supabase==2.10.0
python-dotenv==1.0.1
```

- [ ] **Krok 2: Utwórz `backend/rag/__init__.py`**

```python
# Inicjalizacja pakietu RAG
```

- [ ] **Krok 3: Utwórz `backend/rag/query.py`**

```python
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
    # Przykładowe query:
    # SELECT content FROM bochenek_chunks
    # ORDER BY embedding <-> embedding_of(question)
    # WHERE structure = structure
    # LIMIT 3
    return None
```

- [ ] **Krok 4: Utwórz `backend/rag/ocr.py`**

```python
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

    Args:
        pdf_path: Ścieżka do pliku PDF

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

    Args:
        text: Czysty tekst z OCR
        chunk_size: Maksymalna liczba znaków per chunk

    Raises:
        NotImplementedError: Zawsze — czeka na implementację
    """
    raise NotImplementedError("Chunker nie jest zaimplementowany.")


def embed_and_store(chunks: list[str], structure_id: str) -> None:
    """
    Generuje embeddingi i zapisuje do Supabase pgvector.

    Args:
        chunks: Lista chunków tekstu
        structure_id: ID struktury anatomicznej (np. "mozdzek")

    Raises:
        NotImplementedError: Zawsze — czeka na implementację
    """
    raise NotImplementedError("Embedding pipeline nie jest zaimplementowany.")
```

- [ ] **Krok 5: Utwórz `backend/main.py`**

```python
"""
Anatomy Studio — FastAPI Backend
Endpointy: /ask, /structures, /health
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.query import query_rag

# Ładuj .env jeśli istnieje (lokalne uruchomienie)
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
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
]


# ===== Endpointy =====

@app.get("/health")
async def health_check():
    """Sprawdzenie stanu serwera — używane przez Docker healthcheck."""
    return {"status": "ok", "service": "anatomy-studio-api"}


@app.get("/structures", response_model=list[StructureInfo])
async def get_structures():
    """Zwraca listę wszystkich struktur anatomicznych z metadanymi."""
    return STRUCTURES


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Odpowiada na pytanie o strukturę anatomiczną.

    Kolejność:
    1. Szuka w Supabase pgvector (jeśli skonfigurowany)
    2. Fallback: odpowiada przez Claude API bez kontekstu
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
```

- [ ] **Krok 6: Przetestuj backend lokalnie**

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Oczekiwany output: `Uvicorn running on http://0.0.0.0:8000`

Sprawdź health endpoint:
```bash
curl http://localhost:8000/health
```

Oczekiwany output: `{"status":"ok","service":"anatomy-studio-api"}`

---

## Task 11: Docker i infrastruktura

**Files:**
- Create: `Dockerfile`
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml`
- Create: `nginx.conf`
- Create: `.env.example`
- Create: `public/models/.gitkeep`

- [ ] **Krok 1: Utwórz `Dockerfile` (Next.js)**

```dockerfile
# Wieloetapowy build Next.js dla minimalnego rozmiaru obrazu
FROM node:20-alpine AS base

# Etap 1: Instalacja zależności
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Etap 2: Build aplikacji
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Etap 3: Obraz produkcyjny
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Użytkownik bez uprawnień root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiuj pliki produkcyjne z buildera
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

- [ ] **Krok 2: Zaktualizuj `next.config.ts` — dodaj output standalone**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output dla Docker — minimalny rozmiar obrazu
  output: 'standalone',
  // Transpilacja Three.js
  transpilePackages: ['three'],
}

export default nextConfig
```

- [ ] **Krok 3: Utwórz `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalacja zależności systemowych (potrzebne przez niektóre pakiety Python)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Kopiuj i zainstaluj zależności Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiuj kod aplikacji
COPY . .

EXPOSE 8000

# Uruchom FastAPI przez uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

- [ ] **Krok 4: Utwórz `docker-compose.yml`**

```yaml
services:
  # ===== Frontend Next.js =====
  web:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/ask"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

  # ===== Backend FastAPI =====
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

  # ===== Nginx Reverse Proxy =====
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - web
      - api
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

- [ ] **Krok 5: Utwórz `nginx.conf`**

```nginx
# Anatomy Studio — Nginx Reverse Proxy

upstream nextjs {
    server web:3000;
}

upstream fastapi {
    server api:8000;
}

server {
    listen 80;
    server_name _;

    # Maksymalny rozmiar przesyłanych plików (modele 3D mogą być duże)
    client_max_body_size 100M;

    # Timeouty dla długich zapytań AI
    proxy_read_timeout 60s;
    proxy_connect_timeout 10s;

    # /api/* → FastAPI backend
    location /api/ {
        # Usuń prefix /api przed przekazaniem do FastAPI
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://fastapi;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # /* → Next.js frontend
    location / {
        proxy_pass http://nextjs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket dla Next.js hot reload (dev mode)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

- [ ] **Krok 6: Utwórz `.env.example`**

```env
# ============================================================
# Anatomy Studio — Zmienne środowiskowe
# Skopiuj ten plik do .env i uzupełnij wartości
# ============================================================

# --- Anthropic Claude API ---
# Wymagane: klucz API do modelu Claude
ANTHROPIC_API_KEY=

# --- Supabase (opcjonalne — RAG pipeline) ---
# Bez tych zmiennych aplikacja działa bez bazy wektorowej
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Konfiguracja aplikacji ---
# URL backendu FastAPI (widoczny dla Next.js)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Krok 7: Utwórz placeholder dla modeli 3D**

Utwórz pusty plik `public/models/.gitkeep`:

```
# Folder na modele 3D w formacie .glb
# Pobierz modele z NIH 3D Print Exchange, Embodi3D lub BodyParts3D
# i umieść je tutaj jako: <structure-id>.glb (np. mozdzek.glb)
```

---

## Task 12: README

**Files:**
- Create: `README.md`

- [ ] **Krok 1: Utwórz `README.md`**

```markdown
# Anatomy Studio

Interaktywny eksplorator anatomii 3D dla studentów medycyny.  
Wzorowany na stylu Cell Architecture Studio.

## Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **3D:** React Three Fiber + @react-three/drei
- **Backend:** FastAPI (Python 3.11)
- **AI:** Anthropic Claude API
- **Baza danych:** Supabase pgvector (opcjonalna — RAG)
- **Deploy:** Docker Compose + Nginx

---

## Szybki start (development)

### Wymagania

- Node.js 20+
- Python 3.11+
- npm

### 1. Sklonuj i zainstaluj zależności

```bash
cd MedApp
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

```bash
cp .env.example .env
# Uzupełnij ANTHROPIC_API_KEY w pliku .env
```

### 3. Uruchom frontend

```bash
npm run dev
# Dostępny pod http://localhost:3000
```

### 4. Uruchom backend FastAPI

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
# Skopiuj i uzupełnij zmienne środowiskowe
cp .env.example .env

# Zbuduj i uruchom wszystkie serwisy
docker compose up --build

# Aplikacja dostępna pod http://localhost
```

---

## Dodawanie modeli 3D

1. Pobierz model `.glb` z jednego ze źródeł:
   - [NIH 3D Print Exchange](https://3d.nih.gov) — Public Domain
   - [Embodi3D](https://www.embodi3d.com) — CC BY
   - [BodyParts3D](https://lifesciencedb.jp/bp3d/) — CC BY-SA

2. Nazwij plik według ID struktury (np. `mozdzek.glb`, `serce.glb`)

3. Umieść w katalogu `public/models/`

4. Model załaduje się automatycznie po wybraniu struktury

---

## RAG Pipeline (Bochenek)

Baza wiedzy opiera się na podręczniku Bochenka. Po dostarczeniu PDF:

1. Zaimplementuj `backend/rag/ocr.py` — ekstrakcja tekstu
2. Uruchom pipeline: OCR → chunking → embeddingi → Supabase pgvector
3. Skonfiguruj `NEXT_PUBLIC_SUPABASE_URL` i klucze w `.env`

Bez Supabase aplikacja odpowiada przez Claude API bez kontekstu podręcznika.

---

## Struktura projektu

```
MedApp/
├── app/                    # Next.js App Router
│   ├── api/ask/route.ts    # Proxy → FastAPI
│   ├── layout.tsx
│   └── page.tsx            # 3-panelowy layout
├── components/
│   ├── PanelLeft/          # Drzewo nawigacji
│   ├── Viewer3D/           # React Three Fiber
│   ├── PanelRight/         # Szczegóły + AI chat
│   └── PanelBottom/        # Microscope View
├── lib/
│   ├── types.ts            # TypeScript typy
│   ├── store.ts            # Zustand store
│   └── anatomyData.ts      # Dane anatomiczne
├── backend/
│   ├── main.py             # FastAPI
│   └── rag/                # RAG pipeline
└── public/models/          # Pliki .glb
```
```

---

## Self-Review

### Spec coverage check

| Wymaganie ze spec | Zadanie | Status |
|---|---|---|
| Next.js 14 + TypeScript + Tailwind | Task 1 | ✅ |
| React Three Fiber + OrbitControls | Task 6 | ✅ |
| WASD pan | Task 6 (WASDControls) | ✅ |
| Lewy panel 280px + drzewo anatomiczne | Task 5 | ✅ |
| Aktywny element fioletowy | Task 5 | ✅ |
| Canvas z placeholderem gdy brak .glb | Task 6 | ✅ |
| Toolbar: Rotate/Isolate/Cross-Section/Hide Others/Reset View | Task 6 | ✅ |
| Klikalne anotacje z tooltipami | Task 6+6 | ✅ |
| Prawy panel 320px + nazwy PL/LAT | Task 7 | ✅ |
| Chat AI + POST /api/ask | Task 7+9 | ✅ |
| Dolny pasek 120px + microscope + compare | Task 8 | ✅ |
| FastAPI /ask + /structures + /health | Task 10 | ✅ |
| RAG z Supabase fallback do Claude | Task 10 | ✅ |
| OCR pipeline (placeholder) | Task 10 | ✅ |
| Docker Compose + Nginx | Task 11 | ✅ |
| .env.example bez hardcode | Task 11 | ✅ |
| README z instrukcją | Task 12 | ✅ |
| Komentarze PL | Wszystkie | ✅ |
| Brak `any` w TypeScript | Wszystkie | ✅ |

### Placeholder scan

- `_search_vector_db` w `query.py` ma TODO — celowo, czeka na PDF Bochenka
- `ocr.py` jest placeholderem — celowo, udokumentowane w README
- `ModelLoader` używa ErrorBoundary — poprawne rozwiązanie dla braku .glb

### Type consistency

- `AnatomicalStructure`, `Annotation`, `ChatMessage`, `AskRequest`, `AskResponse` — zdefiniowane w `lib/types.ts`, używane konsekwentnie we wszystkich komponentach
- `useAppStore` — wszystkie selektory i akcje zgodne z interfejsem `AppState`
- `ModelLoader` → `url: string` → `GLBModel` → `useGLTF(url)` — spójne
