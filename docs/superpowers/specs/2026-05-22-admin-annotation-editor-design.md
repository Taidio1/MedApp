# Design: Admin Annotation Editor

**Date:** 2026-05-22
**Scope:** Development-only admin panel for creating and editing 3D annotation points with automatic JSON persistence.

---

## Goal

Build a local authoring panel for 3D anatomical annotation points. The admin user should be able to select a structure, add points on the 3D model, edit existing points, move them, resize them, hide them, delete them, and persist the result automatically in the repository without manually copying TypeScript snippets.

This is a development tool, not a production admin surface.

---

## Decisions

- The editor lives on a dedicated route: `app/admin/annotations/page.tsx`.
- The route and its API are available only when `NODE_ENV === 'development'`.
- Annotation data is stored in a separate JSON file, not directly inside `lib/anatomyData.ts`.
- The primary persistence file is `data/annotations.json`.
- The user-facing viewer merges base anatomy structures with JSON-backed annotations.
- For a structure that exists in both `lib/anatomyData.ts` and `data/annotations.json`, JSON annotations take precedence.

---

## Data Model

`data/annotations.json` stores annotations grouped by structure id:

```json
{
  "serce": [
    {
      "id": "ann-serce-1",
      "label": "Komora lewa",
      "nameLAT": "Ventriculus sinister",
      "description": "Pompuje krew do krazenia ogolnoustrojowego przez aorte.",
      "position": [-0.5, 0, 0.5],
      "size": 0.08,
      "visible": true
    }
  ]
}
```

The existing `Annotation` type should be extended with:

- `size?: number`
- `visible?: boolean`

The `structureId` can remain in the runtime `Annotation` object for compatibility, but the JSON grouping already provides it. Loading helpers should add `structureId` when converting JSON records into app annotations.

---

## Architecture

### Shared Data Helpers

Add a small data layer for annotation loading and merging:

- Read `data/annotations.json`.
- Validate and normalize records.
- Merge annotations into `structures`.
- Preserve the existing `AnatomicalStructure` shape for consumers.

The normal app should not need to know whether an annotation came from `lib/anatomyData.ts` or the JSON file.

### Admin Route

`app/admin/annotations/page.tsx` renders a development-only admin page.

In production builds/runtime, the route should not expose editing functionality. It can call `notFound()` or render a short disabled state. The choice can be made during implementation based on what fits the route structure best.

### Admin API

Add a route handler under `app/api/admin/annotations/route.ts`.

Supported methods:

- `GET`: return all JSON annotations plus the available structures list.
- `PUT`: replace annotations for one structure. The request body includes `structureId` and the complete annotation list for that structure.

Every method must reject non-development environments:

```ts
if (process.env.NODE_ENV !== 'development') {
  return Response.json({ error: 'Admin API disabled' }, { status: 403 })
}
```

Writes should be atomic:

1. Serialize normalized JSON.
2. Write to a temporary file in the same directory.
3. Rename the temporary file over `data/annotations.json`.

---

## Admin UI

The screen has three primary regions.

### Left Panel

- Structure selector.
- List of annotations for the selected structure.
- Actions: add, duplicate, delete.
- Visual state for selected, hidden, and unsaved/error records.

### Center 3D Viewer

The center uses the same model loading path as the normal viewer:

- Model URL: `/models/<structureId>.glb`.
- Layered models should continue to work where layer metadata exists.
- Existing viewer controls such as orbit, zoom, reset, layers, split, explode, and clipping can be reused where practical.

Editor modes:

- `Select`: click a point to select it.
- `Add`: click the model surface to create a point at the raycast hit.
- `Move`: drag the selected point along the model surface when possible.
- `Preview`: show points close to the normal app behavior.

If raycast placement misses the model, the editor should show a small message and avoid creating a bad point.

### Right Inspector

Fields for the selected point:

- Polish label.
- Latin name.
- Description.
- Position `x`, `y`, `z`.
- Size.
- Visible toggle.

Text, position, visibility, and size edits save automatically with a short debounce. A secondary "Save now" action can flush pending changes immediately, but the main workflow should not require manual copy/paste or manual export. If persistence fails, the UI must show the failure and keep the edited state visible.

---

## Validation

The admin API validates data before writing:

- `structureId` must exist in the anatomy structures.
- Annotation ids must be unique within a structure.
- `label` must be non-empty.
- `nameLAT` and `description` are optional strings.
- `position` must be exactly three finite numbers.
- `size` must be a finite number in a safe range, for example `0.02` to `0.25`.
- `visible` defaults to `true`.
- Extra whitespace in text fields is trimmed.

Invalid writes return `400` with a clear error message.

---

## Integration With Viewer

`components/Viewer3D/Annotations.tsx` should render:

- Only annotations where `visible !== false`.
- The point radius from `annotation.size ?? 0.08`.
- Active points slightly larger than their base size.

Existing behavior remains:

- Hover or click activates the annotation detail panel.
- Clicking a point can select the related structure.
- Annotations without optional fields still render correctly.

---

## Error Handling

Admin page states:

- No structure selected.
- Model missing or failed to load.
- No annotations for selected structure.
- Save in progress.
- Save failed.
- JSON file missing or malformed.

For malformed JSON, the admin API should return a clear error and avoid overwriting the file automatically. Manual repair is safer than silently discarding data.

---

## Testing And Verification

Implementation should verify:

- `npx tsc --noEmit`
- `npm run build`
- Manual browser test on `/admin/annotations`:
  - Select a structure.
  - Add a point on the model.
  - Edit label, Latin name, and description.
  - Change size.
  - Hide and show the point.
  - Move the point.
  - Refresh the admin route and confirm changes persist.
  - Open the normal viewer and confirm the same annotations render.

---

## Out Of Scope

- Production authentication.
- Supabase/database persistence.
- Multi-user editing.
- Direct TypeScript source mutation.
- Full version history or undo stack beyond simple local UI state.

---

## Future Extensions

- Replace JSON storage with Supabase once production authoring is needed.
- Add import/export for annotation sets.
- Add keyboard shortcuts for faster annotation authoring.
- Add snapping modes, axes constraints, and surface-normal helpers.
- Add per-layer annotation targeting for complex multi-mesh models.
