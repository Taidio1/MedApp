# Supabase Data Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static `lib/anatomyData.ts` (structures) and `data/annotations.json` (annotations) with live Supabase queries so the app reads anatomy data from the database at runtime.

**Architecture:** New `lib/supabase/structures.ts` fetches structures + layers + annotations from Supabase in one query. A public `GET /api/structures` endpoint exposes this data. Zustand store gains a `structures` record loaded via `loadStructures()` called from `PanelLeft` on mount. The admin annotations API is rewritten to read/write the `annotations` Supabase table instead of a local JSON file.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2 (`@supabase/ssr`), Zustand 5, TypeScript

---

## File Map

| File | Action |
|------|--------|
| `lib/supabase/structures.ts` | CREATE — `fetchStructures(supabase)` |
| `app/api/structures/route.ts` | CREATE — public GET endpoint |
| `lib/store.ts` | MODIFY — add `structures`, `structuresLoading`, `loadStructures` |
| `app/api/admin/annotations/route.ts` | REWRITE — swap JSON file for Supabase |
| `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx` | MODIFY — remove `annotationStore` imports |
| `components/PanelLeft/PanelLeft.tsx` | MODIFY — read from store, trigger load, show spinner |
| `lib/anatomyData.ts` | MODIFY — remove `baseStructures` + annotationStore code |
| `lib/annotationStore.ts` | DELETE |
| `data/annotations.json` | DELETE |

---

## Task 1: Create data access layer

**Files:**
- Create: `lib/supabase/structures.ts`

- [ ] **Step 1.1: Create the file with row types and mapping helpers**

Create `lib/supabase/structures.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import { AnatomicalStructure, Annotation, AnatomyLayer } from '@/lib/types'

interface LayerRow {
  layer_key: string
  label: string
  default_visible: boolean
  is_pair: boolean
  split_axis: string | null
  split_distance: number | null
  split_direction: number | null
  explode_offset: number[] | null
  base_position: number[] | null
  sort_order: number
}

interface AnnotationRow {
  annotation_key: string
  label: string
  name_lat: string | null
  description: string | null
  position: number[]
  size: number
  visible: boolean
}

interface StructureRow {
  id: string
  name_pl: string
  name_lat: string
  anatomical_system: string
  description: string
  biological_notes: string
  anatomy_layers: LayerRow[]
  annotations: AnnotationRow[]
}

function mapLayer(row: LayerRow): AnatomyLayer {
  return {
    id: row.layer_key,
    label: row.label,
    defaultVisible: row.default_visible,
    isPair: row.is_pair,
    ...(row.split_axis ? { splitAxis: row.split_axis as 'x' | 'y' | 'z' } : {}),
    ...(row.split_distance != null ? { splitDistance: row.split_distance } : {}),
    ...(row.split_direction != null ? { splitDirection: row.split_direction as 1 | -1 } : {}),
    ...(row.explode_offset ? { explodeOffset: row.explode_offset as [number, number, number] } : {}),
    ...(row.base_position ? { basePosition: row.base_position as [number, number, number] } : {}),
  }
}

function mapAnnotation(row: AnnotationRow, structureId: string): Annotation {
  return {
    id: row.annotation_key,
    label: row.label,
    ...(row.name_lat != null ? { nameLAT: row.name_lat } : {}),
    ...(row.description != null ? { description: row.description } : {}),
    position: row.position as [number, number, number],
    size: row.size,
    visible: row.visible,
    structureId,
  }
}

export async function fetchStructures(
  supabase: SupabaseClient,
): Promise<Record<string, AnatomicalStructure>> {
  const { data, error } = await supabase
    .from('anatomy_structures')
    .select(`
      id, name_pl, name_lat, anatomical_system, description, biological_notes,
      anatomy_layers (layer_key, label, default_visible, is_pair, split_axis, split_distance, split_direction, explode_offset, base_position, sort_order),
      annotations (annotation_key, label, name_lat, description, position, size, visible)
    `)
    .eq('is_published', true)
    .order('sort_order')

  if (error) throw new Error(error.message)

  const result: Record<string, AnatomicalStructure> = {}

  for (const raw of (data ?? []) as StructureRow[]) {
    const layers = (raw.anatomy_layers ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapLayer)

    result[raw.id] = {
      id: raw.id,
      namePL: raw.name_pl,
      nameLAT: raw.name_lat,
      system: raw.anatomical_system,
      description: raw.description,
      biologicalNotes: raw.biological_notes,
      annotations: (raw.annotations ?? []).map((a) => mapAnnotation(a, raw.id)),
      ...(layers.length > 0 ? { layers } : {}),
    }
  }

  return result
}
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors involving `lib/supabase/structures.ts`. Other pre-existing errors are acceptable at this stage.

- [ ] **Step 1.3: Commit**

```bash
cd E:/MedApp && git add lib/supabase/structures.ts && git commit -m "feat: add fetchStructures data access layer"
```

---

## Task 2: Create public structures endpoint

**Files:**
- Create: `app/api/structures/route.ts`

- [ ] **Step 2.1: Create the route handler**

Create `app/api/structures/route.ts`:

```typescript
import { createSupabaseServerClient } from '@/lib/auth/server'
import { fetchStructures } from '@/lib/supabase/structures'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const structures = await fetchStructures(supabase)
    return Response.json(structures)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać struktur'
    return Response.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2.2: Start dev server and test the endpoint manually**

```bash
cd E:/MedApp && npm run dev
```

In a second terminal (or browser):
```bash
curl http://localhost:3000/api/structures
```

Expected: JSON object keyed by structure IDs (e.g. `{ "kora-mozgowa": { ... }, "mozdzek": { ... }, ... }`). Each value has `id`, `namePL`, `nameLAT`, `system`, `description`, `biologicalNotes`, `annotations[]`, and optionally `layers[]`.

If you get `{ "error": "..." }` — check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local` and that the Supabase schema v0.2 has been applied.

- [ ] **Step 2.3: Commit**

```bash
cd E:/MedApp && git add app/api/structures/route.ts && git commit -m "feat: add GET /api/structures endpoint"
```

---

## Task 3: Extend Zustand store with structures state

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 3.1: Add structures fields to the interface and implementation**

In `lib/store.ts`, add the import and three new state fields. The full file after changes:

```typescript
import { create } from 'zustand'
import { AnatomicalStructure, Annotation, ChatMessage } from './types'

interface AppState {
  selectedStructure: AnatomicalStructure | null
  setSelectedStructure: (structure: AnatomicalStructure | null) => void

  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  isAILoading: boolean
  setIsAILoading: (loading: boolean) => void

  cameraResetTrigger: number
  triggerCameraReset: () => void

  autoRotate: boolean
  setAutoRotate: (rotate: boolean) => void

  activeAnnotation: Annotation | null
  setActiveAnnotation: (annotation: Annotation | null) => void

  layerVisibility: Record<string, boolean>
  setLayerVisibility: (meshId: string, visible: boolean) => void
  resetLayerVisibility: () => void

  explodeAmount: number
  setExplodeAmount: (amount: number) => void

  clippingPlaneY: number | null
  setClippingPlaneY: (y: number | null) => void

  splitOpen: boolean
  setSplitOpen: (open: boolean) => void

  structures: Record<string, AnatomicalStructure>
  structuresLoading: boolean
  loadStructures: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  selectedStructure: null,
  setSelectedStructure: (structure) =>
    set({
      selectedStructure: structure,
      chatMessages: [],
      activeAnnotation: null,
      layerVisibility: {},
      explodeAmount: 0,
      clippingPlaneY: null,
      splitOpen: false,
    }),

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

  activeAnnotation: null,
  setActiveAnnotation: (annotation) => set({ activeAnnotation: annotation }),

  layerVisibility: {},
  setLayerVisibility: (meshId, visible) =>
    set((state) => ({
      layerVisibility: { ...state.layerVisibility, [meshId]: visible },
    })),
  resetLayerVisibility: () => set({ layerVisibility: {} }),

  explodeAmount: 0,
  setExplodeAmount: (amount) => set({ explodeAmount: amount }),

  clippingPlaneY: null,
  setClippingPlaneY: (y) => set({ clippingPlaneY: y }),

  splitOpen: false,
  setSplitOpen: (open) => set({ splitOpen: open }),

  structures: {},
  structuresLoading: false,
  loadStructures: async () => {
    set({ structuresLoading: true })
    try {
      const response = await fetch('/api/structures')
      if (!response.ok) throw new Error('Nie udało się pobrać struktur')
      const data: Record<string, AnatomicalStructure> = await response.json()
      set({ structures: data, structuresLoading: false })
    } catch {
      set({ structuresLoading: false })
    }
  },
}))
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3.3: Commit**

```bash
cd E:/MedApp && git add lib/store.ts && git commit -m "feat: add structures state to Zustand store"
```

---

## Task 4: Rewrite admin annotations API to use Supabase

**Files:**
- Modify: `app/api/admin/annotations/route.ts`

- [ ] **Step 4.1: Rewrite the route handler**

Replace the entire contents of `app/api/admin/annotations/route.ts`:

```typescript
import { createSupabaseServerClient } from '@/lib/auth/server'
import { getCurrentUserProfile } from '@/lib/auth/guards'

const MIN_POINT_SIZE = 0.02
const MAX_POINT_SIZE = 0.25
const DEFAULT_POINT_SIZE = 0.08

interface AnnotationRecord {
  id: string
  label: string
  nameLAT?: string
  description?: string
  position: [number, number, number]
  size?: number
  visible?: boolean
}

async function rejectNonAdmin(): Promise<Response | null> {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }
  if (profile.role !== 'admin') {
    return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  try {
    const supabase = await createSupabaseServerClient()

    const [structuresResult, annotationsResult] = await Promise.all([
      supabase
        .from('anatomy_structures')
        .select('id, name_pl, name_lat, anatomical_system, anatomy_layers(layer_key)')
        .eq('is_published', true)
        .order('sort_order'),
      supabase
        .from('annotations')
        .select('structure_id, annotation_key, label, name_lat, description, position, size, visible')
        .order('structure_id'),
    ])

    if (structuresResult.error) throw new Error(structuresResult.error.message)
    if (annotationsResult.error) throw new Error(annotationsResult.error.message)

    const structures = (structuresResult.data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      namePL: s.name_pl as string,
      nameLAT: s.name_lat as string,
      system: s.anatomical_system as string,
      hasLayers: Array.isArray(s.anatomy_layers) && (s.anatomy_layers as unknown[]).length > 0,
    }))

    const annotations: Record<string, AnnotationRecord[]> = {}
    for (const row of (annotationsResult.data ?? []) as Record<string, unknown>[]) {
      const sid = row.structure_id as string
      if (!annotations[sid]) annotations[sid] = []
      annotations[sid].push({
        id: row.annotation_key as string,
        label: row.label as string,
        ...(row.name_lat != null ? { nameLAT: row.name_lat as string } : {}),
        ...(row.description != null ? { description: row.description as string } : {}),
        position: row.position as [number, number, number],
        size: row.size as number,
        visible: row.visible as boolean,
      })
    }

    return Response.json({ structures, annotations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się pobrać danych'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const rejected = await rejectNonAdmin()
  if (rejected) return rejected

  let body: { structureId?: unknown; annotations?: unknown }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy format JSON' }, { status: 400 })
  }

  if (typeof body.structureId !== 'string') {
    return Response.json({ error: 'Pole structureId jest wymagane' }, { status: 400 })
  }

  if (!Array.isArray(body.annotations)) {
    return Response.json({ error: 'Pole annotations musi być tablicą' }, { status: 400 })
  }

  const structureId = body.structureId
  const incoming = body.annotations as AnnotationRecord[]

  try {
    const supabase = await createSupabaseServerClient()

    const { error: deleteError } = await supabase
      .from('annotations')
      .delete()
      .eq('structure_id', structureId)

    if (deleteError) throw new Error(deleteError.message)

    if (incoming.length > 0) {
      const rows = incoming.map((a) => ({
        structure_id: structureId,
        annotation_key: a.id,
        label: a.label,
        name_lat: a.nameLAT ?? null,
        description: a.description ?? null,
        position: a.position,
        size: a.size != null ? Math.min(MAX_POINT_SIZE, Math.max(MIN_POINT_SIZE, a.size)) : DEFAULT_POINT_SIZE,
        visible: a.visible !== false,
      }))

      const { error: insertError } = await supabase.from('annotations').insert(rows)
      if (insertError) throw new Error(insertError.message)
    }

    return Response.json({ structureId, annotations: incoming })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Nie udało się zapisać anotacji'
    return Response.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 4.2: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors in `app/api/admin/annotations/route.ts`.

- [ ] **Step 4.3: Test admin annotations GET manually**

With dev server running and logged in as admin, open:
```
http://localhost:3000/api/admin/annotations
```

Expected: `{ "structures": [...], "annotations": { ... } }` with data from Supabase.

- [ ] **Step 4.4: Commit**

```bash
cd E:/MedApp && git add app/api/admin/annotations/route.ts && git commit -m "feat: rewrite admin annotations API to use Supabase"
```

---

## Task 5: Remove annotationStore from AdminAnnotationEditor

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`

`AdminAnnotationEditor` imports `annotationSizeBounds` and `AnnotationStoreRecord` from `lib/annotationStore`. Both are defined inline after this task.

- [ ] **Step 5.1: Replace the annotationStore import with inline definitions**

At the top of `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`, replace:
```typescript
import { annotationSizeBounds, AnnotationStoreRecord } from '@/lib/annotationStore'
```

with:
```typescript
const ANNOTATION_SIZE_MIN = 0.02
const ANNOTATION_SIZE_MAX = 0.25
const ANNOTATION_SIZE_DEFAULT = 0.08

interface AnnotationStoreRecord {
  id: string
  label: string
  nameLAT?: string
  description?: string
  position: [number, number, number]
  size?: number
  visible?: boolean
}
```

- [ ] **Step 5.2: Replace annotationSizeBounds references**

In the same file, replace all occurrences of `annotationSizeBounds.default` with `ANNOTATION_SIZE_DEFAULT`, `annotationSizeBounds.min` with `ANNOTATION_SIZE_MIN`, and `annotationSizeBounds.max` with `ANNOTATION_SIZE_MAX`.

There are three locations:
1. `addAnnotation`: `size: annotationSizeBounds.default,` → `size: ANNOTATION_SIZE_DEFAULT,`
2. `<Field label={\`Rozmiar (...)\`}>` slider label: `selectedAnnotation.size ?? annotationSizeBounds.default` → `selectedAnnotation.size ?? ANNOTATION_SIZE_DEFAULT`
3. Slider `min` / `max` / `value` props: same replacement.

- [ ] **Step 5.3: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors in `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`.

- [ ] **Step 5.4: Commit**

```bash
cd E:/MedApp && git add components/AdminAnnotationEditor/AdminAnnotationEditor.tsx && git commit -m "refactor: inline annotationStore constants in AdminAnnotationEditor"
```

---

## Task 6: Update PanelLeft to load structures from store

**Files:**
- Modify: `components/PanelLeft/PanelLeft.tsx`

- [ ] **Step 6.1: Rewrite PanelLeft**

Replace the entire contents of `components/PanelLeft/PanelLeft.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { AnatomyNode } from '@/lib/types'
import { anatomyTree } from '@/lib/anatomyData'
import { useAppStore } from '@/lib/store'

function TreeNode({ node, depth = 0 }: { node: AnatomyNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const { selectedStructure, setSelectedStructure, structures } = useAppStore()

  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isActive = selectedStructure?.id === node.structureId

  const handleClick = () => {
    if (hasChildren) setExpanded((prev) => !prev)

    if (node.structureId && structures[node.structureId]) {
      setSelectedStructure(structures[node.structureId])
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={[
          'w-full text-left py-1.5 rounded text-sm transition-colors',
          'flex items-center gap-1.5',
          isActive
            ? 'bg-[#7c3aed] text-white'
            : 'text-gray-300 hover:bg-[#2a2a4e] hover:text-white',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 14 + 8}px`, paddingRight: '8px' }}
      >
        <span className="text-[10px] w-3 flex-shrink-0 opacity-60">
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </span>

        {node.icon && (
          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#2a2a4e] text-[11px] font-bold leading-none text-[#c4b5fd]">
            {node.icon}
          </span>
        )}

        <span className="truncate">{node.label}</span>
      </button>

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
  const { structuresLoading, loadStructures } = useAppStore()

  useEffect(() => {
    loadStructures()
  }, [loadStructures])

  return (
    <aside className="viewer-mobile-sidebar w-[280px] flex-shrink-0 bg-[#1a1a2e] border-r border-[#2a2a4e] overflow-y-auto flex flex-col">
      <div className="px-4 py-3 border-b border-[#2a2a4e] flex-shrink-0">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Układy Anatomiczne
        </h2>
      </div>

      <nav className="p-2 flex-1">
        {structuresLoading ? (
          <div className="px-2 py-4 text-xs text-gray-500">Ładowanie...</div>
        ) : (
          anatomyTree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} />
          ))
        )}
      </nav>

      <div className="px-4 py-3 border-t border-[#2a2a4e] flex-shrink-0">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Kliknij strukturę aby wyświetlić szczegóły i zapytać AI.
        </p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6.2: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors in `components/PanelLeft/PanelLeft.tsx`.

- [ ] **Step 6.3: Test in browser**

Open `http://localhost:3000`. Log in. Verify:
- Left panel shows "Ładowanie..." briefly, then the anatomy tree appears
- Clicking e.g. "Serce" in the tree selects it (right panel shows name, description)
- Clicking an annotation point in 3D triggers the annotation bubble

- [ ] **Step 6.4: Commit**

```bash
cd E:/MedApp && git add components/PanelLeft/PanelLeft.tsx && git commit -m "feat: load structures from Supabase via store in PanelLeft"
```

---

## Task 7: Clean lib/anatomyData.ts

**Files:**
- Modify: `lib/anatomyData.ts`

`lib/anatomyData.ts` currently exports `baseStructures`, `structures` (merged), imports from `annotationStore`, and calls `mergeStructuresWithAnnotationStore`. After this task it exports only `baseAnatomyTree` and `anatomyTree`.

- [ ] **Step 7.1: Replace lib/anatomyData.ts**

Replace the entire contents of `lib/anatomyData.ts`:

```typescript
import { AnatomyNode } from './types'

export const baseAnatomyTree: AnatomyNode[] = [
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
          { id: 'glowa', label: 'Czaszka i mózg (3D)', structureId: 'glowa' },
        ],
      },
      { id: 'rdzen', label: 'Rdzeń kręgowy', structureId: 'rdzen-kregowy' },
    ],
  },
  {
    id: 'krazenie',
    label: 'Układ Krążenia',
    icon: '♥',
    children: [
      { id: 'serce', label: 'Serce', structureId: 'serce' },
      { id: 'naczynia', label: 'Naczynia krwionośne', structureId: 'naczynia' },
    ],
  },
  {
    id: 'oddechowy',
    label: 'Układ Oddechowy',
    icon: 'O₂',
    children: [
      { id: 'lung', label: 'Płuco', structureId: 'lung' },
    ],
  },
  {
    id: 'pokarmowy',
    label: 'Układ Pokarmowy',
    icon: 'GI',
    children: [
      { id: 'stomach', label: 'Żołądek', structureId: 'stomach' },
      { id: 'liver', label: 'Wątroba', structureId: 'liver' },
    ],
  },
  {
    id: 'moczowy',
    label: 'Układ Moczowy',
    icon: 'N',
    children: [
      { id: 'kidney', label: 'Nerka', structureId: 'kidney' },
    ],
  },
]

export const anatomyTree = baseAnatomyTree
```

- [ ] **Step 7.2: Verify TypeScript compiles**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors. If you see `Cannot find module '@/lib/annotationStore'` anywhere — that file was already removed from all imports in Tasks 4 and 5, so there should be no remaining consumers.

- [ ] **Step 7.3: Commit**

```bash
cd E:/MedApp && git add lib/anatomyData.ts && git commit -m "refactor: remove baseStructures from anatomyData, keep tree only"
```

---

## Task 8: Delete static data files

**Files:**
- Delete: `lib/annotationStore.ts`
- Delete: `data/annotations.json`

- [ ] **Step 8.1: Confirm no remaining imports of annotationStore**

```bash
cd E:/MedApp && grep -r "annotationStore" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules --exclude-dir=.next
```

Expected: no output. If any files appear, fix those imports before continuing.

- [ ] **Step 8.2: Delete the files**

```bash
cd E:/MedApp && rm lib/annotationStore.ts data/annotations.json
```

- [ ] **Step 8.3: Verify TypeScript compiles cleanly**

```bash
cd E:/MedApp && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8.4: Verify production build succeeds**

```bash
cd E:/MedApp && npm run build
```

Expected: build completes without errors.

- [ ] **Step 8.5: Commit**

```bash
cd E:/MedApp && git add -A && git commit -m "chore: delete annotationStore.ts and annotations.json"
```

---

## Task 9: End-to-end smoke test

- [ ] **Step 9.1: Start dev server and run through the golden path**

```bash
cd E:/MedApp && npm run dev
```

Verify each of the following manually in the browser:

1. Open `http://localhost:3000`. Log in.
2. Left panel briefly shows "Ładowanie..." then tree appears with all 5 systems.
3. Click "Serce" — right panel shows Polish/Latin name, description, biological notes.
4. Click an annotation dot on the 3D model — bubble appears with annotation label.
5. Click "Płuco" — model loads, 3 annotation dots visible in 3D viewer, PanelBottom shows "3 anotacje".
6. Click "Czaszka i mózg (3D)" — layer panel appears (skull_left, skull_right, brain, brainstem).

- [ ] **Step 9.2: Smoke test admin panel**

1. Log in as admin. Navigate to `/admin/annotations`.
2. Structure dropdown shows all structures from Supabase.
3. Select "Serce" — existing annotations load (if any in DB).
4. Add a new annotation point — it saves to Supabase (header shows "Zapisano").
5. Reload the page — the annotation persists.

- [ ] **Step 9.3: Final commit**

```bash
cd E:/MedApp && git add -A && git commit -m "feat: complete migration of anatomy data to Supabase"
```
