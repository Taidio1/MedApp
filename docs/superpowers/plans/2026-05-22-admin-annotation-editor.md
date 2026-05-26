# Admin Annotation Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a development-only `/admin/annotations` editor that creates, edits, moves, resizes, hides, deletes, and automatically persists 3D annotation points to `data/annotations.json`.

**Architecture:** Add a JSON-backed annotation data layer, a dev-only admin route handler for atomic filesystem persistence, a dedicated admin page with a three-panel editor, and update the normal viewer to use merged JSON annotations. Keep the existing public viewer shape intact by returning normal `AnatomicalStructure` objects with normalized runtime annotations.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, React Three Fiber, @react-three/drei, Three.js, Node filesystem APIs in route handlers, built-in Node verification script.

---

## File Structure

- Create `data/annotations.json`: repository-tracked JSON annotation store grouped by structure id.
- Create `lib/annotationStore.ts`: pure shared validation, normalization, merge, and type helpers for JSON-backed annotations.
- Modify `lib/types.ts`: add optional `size` and `visible` fields to `Annotation`.
- Modify `lib/anatomyData.ts`: export `baseStructures`, `baseAnatomyTree`, and merged `structures`/`anatomyTree` using JSON annotations.
- Create `app/api/admin/annotations/route.ts`: development-only `GET` and `PUT` route handler with atomic writes.
- Create `app/admin/annotations/page.tsx`: development-only server route shell.
- Create `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`: client editor UI and autosave orchestration.
- Create `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx`: R3F canvas for admin placement, selection, moving, preview, and sizing.
- Modify `components/Viewer3D/Annotations.tsx`: honor `size` and `visible`.
- Modify `package.json`: add `verify:admin-annotations`.
- Create `scripts/verify-admin-annotations.mjs`: behavioral verification for JSON store, API route source guards, and viewer integration source checks.

---

### Task 1: Add Failing Verification For Admin Annotation Storage

**Files:**
- Create: `scripts/verify-admin-annotations.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-admin-annotations.mjs` with checks for the expected JSON file, schema fields, admin API dev guard, atomic rename, and viewer support for `visible` and `size`.

- [ ] **Step 2: Add npm script**

Add `"verify:admin-annotations": "node scripts/verify-admin-annotations.mjs"` to `package.json`.

- [ ] **Step 3: Run and verify RED**

Run `npm run verify:admin-annotations`.

Expected: fail because `data/annotations.json`, `lib/annotationStore.ts`, and the admin API do not exist yet.

---

### Task 2: Implement JSON Data Layer

**Files:**
- Create: `data/annotations.json`
- Create: `lib/annotationStore.ts`
- Modify: `lib/types.ts`
- Modify: `lib/anatomyData.ts`

- [ ] **Step 1: Add tracked JSON store**

Create `data/annotations.json` with `{}`.

- [ ] **Step 2: Extend annotation type**

Add optional `size?: number` and `visible?: boolean` to `Annotation`.

- [ ] **Step 3: Add validation and merge helpers**

Create `lib/annotationStore.ts` with:

- `AnnotationStoreRecord`
- `AnnotationStore`
- `normalizeAnnotationStore`
- `mergeStructuresWithAnnotationStore`
- `getAnnotationStoreForClient`

Validation must enforce existing structure ids, unique annotation ids per structure, non-empty labels, finite `[x, y, z]`, `size` range `0.02..0.25`, and `visible` default `true`.

- [ ] **Step 4: Wire anatomy data merge**

Update `lib/anatomyData.ts` so exported `structures` use `getAnnotationStoreForClient()` and JSON-backed annotations override static `annotations` for structures present in JSON.

- [ ] **Step 5: Run GREEN checks**

Run:

```bash
npm run verify:admin-annotations
npx tsc --noEmit
```

Expected: verification passes far enough for data layer checks; TypeScript compiles.

---

### Task 3: Add Dev-Only Admin API

**Files:**
- Create: `app/api/admin/annotations/route.ts`
- Modify: `scripts/verify-admin-annotations.mjs`

- [ ] **Step 1: Expand verification script**

Ensure the script checks `app/api/admin/annotations/route.ts` for `NODE_ENV !== 'development'`, `writeFile`, and `rename`.

- [ ] **Step 2: Verify RED**

Run `npm run verify:admin-annotations`.

Expected: fail because the route file does not exist.

- [ ] **Step 3: Implement route handler**

Create `GET` to return available structures and current annotations. Create `PUT` to validate and replace annotations for one structure. Use `fs/promises`, write a temporary file, then rename it over `data/annotations.json`.

- [ ] **Step 4: Run GREEN checks**

Run:

```bash
npm run verify:admin-annotations
npx tsc --noEmit
```

Expected: verification and TypeScript pass.

---

### Task 4: Update Normal Annotation Rendering

**Files:**
- Modify: `components/Viewer3D/Annotations.tsx`

- [ ] **Step 1: Verify RED is covered**

`npm run verify:admin-annotations` should fail until viewer source includes both `visible !== false` and `annotation.size`.

- [ ] **Step 2: Implement rendering changes**

Filter out annotations where `visible === false`. Use `annotation.size ?? 0.08` for the base radius and enlarge active points from that base.

- [ ] **Step 3: Run GREEN checks**

Run:

```bash
npm run verify:admin-annotations
npx tsc --noEmit
```

Expected: verification and TypeScript pass.

---

### Task 5: Build Admin Editor Route And UI

**Files:**
- Create: `app/admin/annotations/page.tsx`
- Create: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`
- Create: `components/AdminAnnotationEditor/AdminAnnotationCanvas.tsx`

- [ ] **Step 1: Create dev-only server page**

Render `notFound()` outside development. Inside development, render the client editor.

- [ ] **Step 2: Build editor state shell**

Fetch `/api/admin/annotations`, keep selected structure, selected annotation, editor mode, save state, error state, and debounced autosave.

- [ ] **Step 3: Build left panel**

Add structure selector, annotation list, add, duplicate, and delete actions.

- [ ] **Step 4: Build center canvas**

Use R3F canvas, load `/models/<structureId>.glb`, raycast clicks for add mode, render editable points, select points, and support drag-style movement by raycasting against scene meshes.

- [ ] **Step 5: Build right inspector**

Add fields for label, Latin name, description, x/y/z, size, visible, save now, and delete.

- [ ] **Step 6: Run compile checks**

Run:

```bash
npx tsc --noEmit
```

Expected: TypeScript compiles.

---

### Task 6: Build And Browser Verify

**Files:**
- No planned source edits unless verification uncovers issues.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run verify:admin-annotations
npx tsc --noEmit
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run dev server**

Run `npm run dev` and open `/admin/annotations`.

- [ ] **Step 3: Manual browser test**

In the browser, select a structure, add a point, edit fields, change size, toggle visibility, move the point, reload `/admin/annotations`, and verify persistence. Then open `/` and confirm the annotation renders in the normal viewer.

- [ ] **Step 4: Commit implementation**

Stage only files related to the admin annotation editor and commit with:

```bash
git commit -m "feat: add dev admin annotation editor"
```
