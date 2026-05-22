# Admin Annotation Editor — UX + AI Suggest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add grid snapping, distance display, and a one-click AI-assisted annotation placement feature to the admin annotation editor.

**Architecture:** AdminAnnotationCanvas gets snap props + a forwardRef handle that exposes `captureViews()`. AdminAnnotationEditor owns snap state, calls `captureViews()` on the canvas ref, then POSTs images to a new `/api/admin/suggest-annotation` route that calls Claude Vision and returns `[x, y, z]`.

**Tech Stack:** React Three Fiber (`useThree`, `useImperativeHandle`, `forwardRef`), Three.js (`PerspectiveCamera`, `WebGLRenderer`), `@anthropic-ai/sdk`, Next.js App Router Route Handler.

---

## File Map

| File | Action |
|---|---|
| `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx` | Modify — snap props, `forwardRef`, `CaptureController` |
| `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx` | Modify — snap state + UI, distance display, suggest button |
| `app/api/admin/suggest-annotation/route.ts` | Create — validation, Claude Vision call, coord clamping |
| `scripts/verify-ai-suggest.mjs` | Create — static verification script |
| `package.json` | Modify — add `verify:ai-suggest` script |

---

## Task 1: Install @anthropic-ai/sdk

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies, no errors.

- [ ] **Step 2: Verify import resolves**

```bash
node -e "require('@anthropic-ai/sdk'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @anthropic-ai/sdk"
```

---

## Task 2: Grid snapping in AdminAnnotationCanvas

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx`

- [ ] **Step 1: Add snap props to the interface and inner components**

Add two props to `AdminAnnotationCanvasProps`:

```tsx
interface AdminAnnotationCanvasProps {
  // ... existing props ...
  snapEnabled: boolean
  snapStep: number
}
```

Add a `snapToGrid` helper at the top of the file (after imports, before `ModelLoadBoundary`):

```tsx
function snapToGrid(value: number, step: number): number {
  return Math.round(value / step) * step
}
```

- [ ] **Step 2: Pass snap into EditableModel and EditablePoint**

Update `EditableModel` signature:

```tsx
function EditableModel({
  url,
  mode,
  onAddAnnotation,
  onMessage,
  snapEnabled,
  snapStep,
}: {
  url: string
  mode: EditorMode
  onAddAnnotation: (position: [number, number, number]) => void
  onMessage: (message: string) => void
  snapEnabled: boolean
  snapStep: number
}) {
```

Inside `handleClick` in `EditableModel`, replace the `onAddAnnotation` call with:

```tsx
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'add') return
    event.stopPropagation()
    const p = event.point
    const snap = (v: number) => snapEnabled ? snapToGrid(v, snapStep) : Number(v.toFixed(3))
    onAddAnnotation([snap(p.x), snap(p.y), snap(p.z)])
  }
```

Update `EditablePoint` signature:

```tsx
function EditablePoint({
  annotation,
  mode,
  selected,
  onSelectAnnotation,
  onMoveAnnotation,
  snapEnabled,
  snapStep,
}: {
  annotation: Annotation
  mode: EditorMode
  selected: boolean
  onSelectAnnotation: (id: string) => void
  onMoveAnnotation: (id: string, position: [number, number, number]) => void
  snapEnabled: boolean
  snapStep: number
}) {
```

Inside `handlePointerMove` in `EditablePoint`, replace the `onMoveAnnotation` call with:

```tsx
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || mode !== 'move') return
    event.stopPropagation()
    const hit = event.intersections.find(
      (intersection) => intersection.object.userData.isEditableModelMesh,
    )
    const point = hit?.point ?? event.point
    const snap = (v: number) => snapEnabled ? snapToGrid(v, snapStep) : Number(v.toFixed(3))
    onMoveAnnotation(annotation.id, [snap(point.x), snap(point.y), snap(point.z)])
  }
```

- [ ] **Step 3: Wire snap props into the JSX**

In `AdminAnnotationCanvas`'s render, pass snap props to `EditableModel`:

```tsx
<EditableModel
  url={modelUrl}
  mode={mode}
  onAddAnnotation={onAddAnnotation}
  onMessage={onMessage}
  snapEnabled={snapEnabled}
  snapStep={snapStep}
/>
```

Pass snap props to each `EditablePoint`:

```tsx
{annotations.map((annotation) => (
  <EditablePoint
    key={annotation.id}
    annotation={annotation}
    mode={mode}
    selected={annotation.id === selectedAnnotationId}
    onSelectAnnotation={onSelectAnnotation}
    onMoveAnnotation={onMoveAnnotation}
    snapEnabled={snapEnabled}
    snapStep={snapStep}
  />
))}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx
git commit -m "feat: add grid snapping to AdminAnnotationCanvas"
```

---

## Task 3: Snap state and UI in AdminAnnotationEditor

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`

- [ ] **Step 1: Add snap state**

Inside `AdminAnnotationEditor`, after the existing `useState` declarations, add:

```tsx
const [snapEnabled, setSnapEnabled] = useState(false)
const [snapStep, setSnapStep] = useState(0.05)
```

- [ ] **Step 2: Pass snap to canvas**

Find `<AdminAnnotationCanvas` and add the two props:

```tsx
<AdminAnnotationCanvas
  annotations={annotations}
  mode={mode}
  modelUrl={modelUrl}
  selectedAnnotationId={selectedAnnotationId}
  onAddAnnotation={addAnnotation}
  onMoveAnnotation={(id, position) => patchAnnotation(id, { position }, 250)}
  onSelectAnnotation={setSelectedAnnotationId}
  onMessage={(nextMessage) => {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage(null), 2200)
  }}
  snapEnabled={snapEnabled}
  snapStep={snapStep}
/>
```

- [ ] **Step 3: Add snap controls to the mode toolbar**

In the `<section className="grid min-h-0 grid-rows-[42px_1fr]">` block, inside the top toolbar `<div>` (after the mode buttons), add:

```tsx
<div className="ml-auto flex items-center gap-2">
  <label className="flex items-center gap-1.5 text-xs text-slate-300">
    <input
      type="checkbox"
      checked={snapEnabled}
      onChange={(e) => setSnapEnabled(e.target.checked)}
      className="h-3.5 w-3.5 accent-[#fbbf24]"
    />
    Snap
  </label>
  {snapEnabled && (
    <input
      type="number"
      min={0.01}
      max={0.5}
      step={0.01}
      value={snapStep}
      onChange={(e) => setSnapStep(Number(e.target.value))}
      className="w-16 rounded border border-[#334155] bg-[#0f172a] px-2 py-1 text-xs text-slate-100 outline-none focus:border-[#fbbf24]"
    />
  )}
  {message && <span className="text-[11px] text-amber-200">{message}</span>}
</div>
```

Also remove the existing `{message && ...}` span that was standalone in the toolbar (it's now inside the new `ml-auto` div above).

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/AdminAnnotationEditor/AdminAnnotationEditor.tsx
git commit -m "feat: add snap controls to AdminAnnotationEditor toolbar"
```

---

## Task 4: Distance-from-centre display in inspector

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`

- [ ] **Step 1: Add distance display below X/Y/Z grid**

Find the `<div className="grid grid-cols-3 gap-2">` block (the X/Y/Z inputs). Directly after the closing `</div>` of that grid, add:

```tsx
<p className="text-[11px] text-[#8a8174]">
  r ={' '}
  {Math.sqrt(
    selectedAnnotation.position[0] ** 2 +
    selectedAnnotation.position[1] ** 2 +
    selectedAnnotation.position[2] ** 2,
  ).toFixed(3)}
  {' '}(odległość od centrum)
</p>
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AdminAnnotationEditor/AdminAnnotationEditor.tsx
git commit -m "feat: show distance-from-centre in annotation inspector"
```

---

## Task 5: captureViews ref in AdminAnnotationCanvas

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx`

- [ ] **Step 1: Add imports and handle interface**

At the top of the file, extend the existing React import and add Three.js imports needed for capture:

```tsx
import { Component, ReactNode, Suspense, forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
```

After the `EditorMode` type export, add the handle interface:

```tsx
export interface AdminAnnotationCanvasHandle {
  captureViews(): Promise<string[]>
}
```

- [ ] **Step 2: Add CaptureController component**

Add this component after the `EditablePoint` component definition (before `AdminAnnotationCanvas`):

```tsx
function CaptureController({
  captureRef,
}: {
  captureRef: React.ForwardedRef<AdminAnnotationCanvasHandle>
}) {
  const { gl, scene } = useThree()

  useImperativeHandle(captureRef, () => ({
    captureViews: async (): Promise<string[]> => {
      const captureCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      const views: [number, number, number][] = [
        [0, 0, 5],
        [5, 0, 0],
        [0, 0, -5],
        [0, 5, 0],
      ]
      const images: string[] = []
      for (const [x, y, z] of views) {
        captureCamera.position.set(x, y, z)
        captureCamera.lookAt(0, 0, 0)
        captureCamera.aspect = gl.domElement.width / gl.domElement.height
        captureCamera.updateProjectionMatrix()
        gl.render(scene, captureCamera)
        images.push(gl.domElement.toDataURL('image/jpeg', 0.7))
      }
      return images
    },
  }))

  return null
}
```

- [ ] **Step 3: Convert AdminAnnotationCanvas to forwardRef**

Replace the current export signature:

```tsx
// BEFORE
export function AdminAnnotationCanvas({
  annotations,
  mode,
  modelUrl,
  selectedAnnotationId,
  onAddAnnotation,
  onMoveAnnotation,
  onSelectAnnotation,
  onMessage,
  snapEnabled,
  snapStep,
}: AdminAnnotationCanvasProps) {
  return (
```

With:

```tsx
// AFTER
export const AdminAnnotationCanvas = forwardRef<
  AdminAnnotationCanvasHandle,
  AdminAnnotationCanvasProps
>(function AdminAnnotationCanvas(
  {
    annotations,
    mode,
    modelUrl,
    selectedAnnotationId,
    onAddAnnotation,
    onMoveAnnotation,
    onSelectAnnotation,
    onMessage,
    snapEnabled,
    snapStep,
  },
  ref,
) {
  return (
```

Close the function with an extra `)` after the final `}`:

```tsx
    </div>
  )
}) // <-- closes forwardRef
```

- [ ] **Step 4: Mount CaptureController inside Canvas**

Inside the `<Canvas>` JSX, add `<CaptureController captureRef={ref} />` as the first child:

```tsx
<Canvas
  camera={{ position: [0, 0, 5], fov: 50 }}
  gl={{ antialias: true, alpha: false }}
  onPointerMissed={() => {
    if (mode === 'add') onMessage('Kliknij bezpośrednio w model, aby dodać punkt.')
  }}
>
  <CaptureController captureRef={ref} />
  <ambientLight intensity={0.45} />
  {/* ... rest unchanged ... */}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx
git commit -m "feat: expose captureViews handle on AdminAnnotationCanvas"
```

---

## Task 6: "Zasugeruj pozycję" button in AdminAnnotationEditor

**Files:**
- Modify: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`

- [ ] **Step 1: Add imports and ref**

Add to the import from React:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
```

Add the handle import:

```tsx
import {
  AdminAnnotationCanvas,
  AdminAnnotationCanvasHandle,
  EditorMode,
} from './AdminAnnotationCanvas'
```

Inside `AdminAnnotationEditor`, add a canvas ref and suggest state after the existing `useRef` declarations:

```tsx
const canvasRef = useRef<AdminAnnotationCanvasHandle>(null)
```

Add suggest state after the existing `useState` declarations:

```tsx
type SuggestState = 'idle' | 'loading' | 'done' | 'error'
const [suggestState, setSuggestState] = useState<SuggestState>('idle')
```

- [ ] **Step 2: Add suggestPosition handler**

Add this function inside `AdminAnnotationEditor`, after `flushSave`:

```tsx
const suggestPosition = async () => {
  if (!selectedAnnotation || !canvasRef.current || !selectedStructure) return
  setSuggestState('loading')
  setError(null)
  try {
    const images = await canvasRef.current.captureViews()
    const response = await fetch('/api/admin/suggest-annotation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structureId: selectedStructureId,
        structureNamePL: selectedStructure.namePL,
        annotationLabel: selectedAnnotation.label,
        images,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'Błąd AI')
    patchAnnotation(selectedAnnotation.id, { position: data.position }, 0)
    setSuggestState('done')
    window.setTimeout(() => setSuggestState('idle'), 2200)
  } catch (suggestError) {
    setSuggestState('error')
    setError(suggestError instanceof Error ? suggestError.message : 'Nieznany błąd AI')
  }
}
```

- [ ] **Step 3: Wire ref to canvas**

In the `<AdminAnnotationCanvas` JSX, add `ref={canvasRef}`:

```tsx
<AdminAnnotationCanvas
  ref={canvasRef}
  annotations={annotations}
  {/* ... all existing props ... */}
/>
```

- [ ] **Step 4: Add suggest button to inspector**

In the `!selectedAnnotation` branch, no change. In the `selectedAnnotation` branch, find the existing `<div className="flex gap-2 pt-2">` buttons block and add the suggest button above it:

```tsx
{selectedAnnotation.label.trim() !== '' && (
  <button
    onClick={suggestPosition}
    disabled={suggestState === 'loading'}
    className="w-full rounded border border-[#7c3aed]/50 px-3 py-2 text-sm font-semibold text-[#7c3aed] disabled:opacity-40 hover:bg-[#7c3aed]/10 transition-colors"
  >
    {suggestState === 'loading'
      ? 'Pytam AI…'
      : suggestState === 'done'
        ? 'Pozycja zaktualizowana'
        : 'Zasugeruj pozycję'}
  </button>
)}

<div className="flex gap-2 pt-2">
  {/* existing Zapisz / Usuń buttons */}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/AdminAnnotationEditor/AdminAnnotationEditor.tsx
git commit -m "feat: add Zasugeruj pozycję button with AI suggest flow"
```

---

## Task 7: /api/admin/suggest-annotation route

**Files:**
- Create: `app/api/admin/suggest-annotation/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/admin/suggest-annotation/route.ts` with the following content:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { getCurrentUserProfile } from '@/lib/auth/guards'

const COORD_MIN = -1.4
const COORD_MAX = 1.4
const MAX_IMAGE_BYTES = 512 * 1024

function clamp(v: number): number {
  return Math.min(COORD_MAX, Math.max(COORD_MIN, v))
}

async function callClaude(
  client: Anthropic,
  images: string[],
  prompt: string,
): Promise<{ x: number; y: number; z: number } | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    temperature: 0,
    system:
      'You are an expert anatomist. Return ONLY valid JSON with no explanation, markdown, or code blocks.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...images.slice(0, 4).map((img) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: img.replace(/^data:image\/[^;]+;base64,/, ''),
            },
          })),
        ],
      },
    ],
  })

  const text =
    response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(text)
    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      typeof parsed.z === 'number'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const profile = await getCurrentUserProfile()
  if (!profile) {
    return Response.json({ error: 'Brak autoryzacji' }, { status: 401 })
  }
  if (profile.role !== 'admin') {
    return Response.json({ error: 'Brak uprawnień' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Nieprawidłowy format JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  if (
    typeof b?.structureNamePL !== 'string' ||
    typeof b?.annotationLabel !== 'string' ||
    !Array.isArray(b?.images) ||
    b.images.length < 1
  ) {
    return Response.json({ error: 'Brakuje wymaganych pól' }, { status: 400 })
  }

  const { structureNamePL, annotationLabel, images } = b as {
    structureNamePL: string
    annotationLabel: string
    images: string[]
  }

  for (const img of images) {
    const raw = img.replace(/^data:image\/[^;]+;base64,/, '')
    if (Buffer.byteLength(raw, 'base64') > MAX_IMAGE_BYTES) {
      return Response.json({ error: 'Obraz zbyt duży (max 512 KB)' }, { status: 400 })
    }
  }

  const prompt =
    `This is a 3D anatomical model of "${structureNamePL}" rendered from ${Math.min(images.length, 4)} angles ` +
    `(front, right, back, top). Coordinate space: normalized, max dimension = 2.8 units, ` +
    `centered at origin, range approximately -1.4 to +1.4 on each axis.\n\n` +
    `Identify the anatomical position of: "${annotationLabel}"\n\n` +
    `Return ONLY valid JSON: {"x": number, "y": number, "z": number}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    let coords = await callClaude(client, images, prompt)

    if (!coords) {
      const retryPrompt =
        `${prompt}\n\nIMPORTANT: Respond ONLY with the JSON object. ` +
        `Example: {"x": 0.3, "y": -0.5, "z": 0.1}`
      coords = await callClaude(client, images, retryPrompt)
    }

    if (!coords) {
      return Response.json(
        { error: 'AI nie zwróciło prawidłowej pozycji' },
        { status: 422 },
      )
    }

    const position: [number, number, number] = [
      clamp(coords.x),
      clamp(coords.y),
      clamp(coords.z),
    ]

    return Response.json({ position })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Błąd AI'
    return Response.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/suggest-annotation/route.ts
git commit -m "feat: add /api/admin/suggest-annotation route with Claude Vision"
```

---

## Task 8: Verification script

**Files:**
- Create: `scripts/verify-ai-suggest.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create verification script**

Create `scripts/verify-ai-suggest.mjs`:

```js
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }
function assert(cond, msg) { if (!cond) throw new Error(msg) }
function assertFile(p) { assert(fs.existsSync(path.join(root, p)), `Missing ${p}`) }

assertFile('app/api/admin/suggest-annotation/route.ts')

const route = read('app/api/admin/suggest-annotation/route.ts')
assert(route.includes('export async function POST'), 'route must export POST')
assert(route.includes('claude-sonnet-4-6'), 'route must use claude-sonnet-4-6')
assert(route.includes('clamp'), 'route must clamp coordinates')
assert(route.includes('401') && route.includes('403'), 'route must check auth')
assert(route.includes('callClaude'), 'route must have retry logic via callClaude')

const canvas = read('components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx')
assert(canvas.includes('AdminAnnotationCanvasHandle'), 'canvas must export handle interface')
assert(canvas.includes('captureViews'), 'canvas must expose captureViews')
assert(canvas.includes('forwardRef'), 'canvas must use forwardRef')
assert(canvas.includes('snapToGrid'), 'canvas must have snapToGrid')

const editor = read('components/AdminAnnotationEditor/AdminAnnotationEditor.tsx')
assert(editor.includes('suggestPosition'), 'editor must have suggestPosition handler')
assert(editor.includes('canvasRef'), 'editor must hold canvasRef')
assert(editor.includes('Zasugeruj pozycję'), 'editor must render suggest button label')
assert(editor.includes('snapEnabled'), 'editor must have snapEnabled state')
assert(editor.includes('odległość od centrum'), 'editor must show distance label')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['verify:ai-suggest'] === 'node scripts/verify-ai-suggest.mjs',
  'package.json must expose verify:ai-suggest'
)

console.log('AI suggest verification passed ✓')
```

- [ ] **Step 2: Add script to package.json**

In `package.json`, add to the `scripts` block:

```json
"verify:ai-suggest": "node scripts/verify-ai-suggest.mjs"
```

- [ ] **Step 3: Run the verification**

```bash
npm run verify:ai-suggest
```

Expected output: `AI suggest verification passed ✓`

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-ai-suggest.mjs package.json
git commit -m "chore: add verify:ai-suggest script"
```

---

## Final check

- [ ] **TypeScript clean build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **All verifications**

```bash
npm run verify:ai-suggest
```

Expected: `AI suggest verification passed ✓`
