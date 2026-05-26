# Admin Annotation Editor — UX Improvements + AI Suggest

**Date:** 2026-05-22
**Status:** Approved

---

## Scope

Two parallel improvements to the admin annotation editor (`/admin/annotations`):

1. **UX precision tools** — snapping, live coordinate display, distance indicator
2. **AI-assisted annotation placement** — single click suggests [x, y, z] for the selected annotation via Claude Vision

---

## 1. UX Editor Improvements

### Grid Snapping

- Snap toggle button + grid step input added to the mode toolbar in `AdminAnnotationCanvas`
- Default step: `0.05` (normalized units, ~2% of model extent)
- When enabled, all new positions are rounded via `snapToGrid(value, step) = Math.round(value / step) * step`
- Applied in both `Add` mode (on click) and `Move` mode (on pointer move)
- State lives in `AdminAnnotationEditor`, passed as props to `AdminAnnotationCanvas`

### Live Coordinate + Distance Display

- Inspector panel (`AdminAnnotationEditor`) shows distance from model center below the X/Y/Z fields:
  `r = √(x² + y² + z²)` — useful to judge whether a point is on the surface vs. inside the mesh
- X/Y/Z fields already update live (controlled inputs); no structural change needed

### Raycasting

Already implemented correctly — `event.point` in React Three Fiber is the surface intersection point. No changes needed.

---

## 2. AI Suggest: Flow

### Trigger

- Button **„Zasugeruj pozycję"** appears in the inspector when an annotation with a non-empty `label` is selected
- States: `idle` → `loading` (spinner + "Pytam AI…") → `done` (flash "Pozycja zaktualizowana") / `error` (inline error message)

### Client-side screenshot capture

- Implemented via a `captureViews()` function inside `AdminAnnotationCanvas`, exposed via a ref
- Captures 4 views: front `(0,0,5)`, right `(5,0,0)`, back `(0,0,-5)`, top `(0,5,0)`
- For each view: temporarily set `camera.position`, call `gl.render(scene, camera)`, read `gl.domElement.toDataURL('image/jpeg', 0.8)`
- Camera is restored after all 4 captures; no visible flicker to the user
- Each image is capped at 512×512px (canvas resized via `gl.setSize` before capture, restored after)
- Output: `string[]` — 4 base64-encoded JPEG strings

### API call

`POST /api/admin/suggest-annotation`

Request body:
```ts
{
  structureId: string
  structureNamePL: string
  annotationLabel: string
  images: string[]   // 4 base64 JPEGs
}
```

Response:
```ts
{ position: [number, number, number] }
```

On success: client calls `patchAnnotation(id, { position })` and sets saveState to `dirty`.

---

## 3. API Route: `/api/admin/suggest-annotation`

### Auth

Reuses `rejectNonAdmin()` — identical guard to `/api/admin/annotations`.

### Validation

- All string fields required
- `images` must be array of 1–4 strings, each ≤ 512 KB after base64 decode
- Returns 400 with descriptive error on any violation

### Claude call

- Model: `claude-sonnet-4-6`
- Temperature: `0`
- System prompt: instructs the model to return only JSON, nothing else
- User message: structure name, annotation label, coordinate space description (normalized, max 2.8, range ~-1.4 to +1.4), + 4 images as `image` content blocks (base64, `image/jpeg`)
- Timeout: 15 s

### Response parsing

1. Parse Claude's text response as JSON → extract `{ x, y, z }`
2. If parse fails: retry once with a stricter prompt ("respond ONLY with JSON, no explanation")
3. If still fails: return 422 with error
4. Clamp each coordinate to [-1.4, 1.4] before returning (graceful handling of out-of-range suggestions)

### Response

```ts
{ position: [x, y, z] }
```

---

## Files Changed

| File | Change |
|---|---|
| `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx` | Add snap props, `captureViews` ref, pass snap to add/move handlers |
| `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx` | Add snap state, distance display in inspector, "Zasugeruj pozycję" button + loading state |
| `app/api/admin/suggest-annotation/route.ts` | New file — validation, Claude Vision call, coordinate clamping |

---

## Out of Scope

- Batch suggestion (all annotations at once) — single annotation only
- Real-world cm conversion — models are in arbitrary scale
- Persistent model scale configuration per structure
