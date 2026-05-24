# 3D Learning Modes Design

## Goal

Improve learning on existing 3D anatomy models by turning annotations into a structured study system. The feature should support guided study, exam-style quiz practice, and annotation filters tied to anatomical layers. The first implementation should reuse the current 3D viewer, selected structure state, annotations, and bottom panel rather than creating a separate learning app.

## User Experience

The user selects an anatomical structure as they do today. The bottom panel becomes the main learning surface with three tabs:

- `Punkty`: a browseable list of annotation points for the selected model.
- `Nauka`: a guided study path through filtered annotation points.
- `Quiz`: a self-check mode that hides labels and asks the user to identify highlighted points.

The viewer remains the central visual anchor. Selecting a point in any tab highlights the corresponding 3D annotation. Hovering or clicking a point in the model keeps the current behavior, but it also respects the active annotation-layer filters.

## Annotation Layers

Annotations receive a lightweight learning metadata layer. Each annotation can belong to one or more point layers such as:

- `organ`: main anatomical landmarks.
- `vessels`: arteries, veins, and blood supply.
- `nerves`: innervation and neural pathways.
- `clinical`: clinically relevant points.
- `topography`: spatial relations and orientation landmarks.

The UI exposes these as multi-select filters. Users can enable one layer, several layers, or all layers. If no layer is assigned to an annotation, it is treated as `organ` for backward compatibility.

These point layers are separate from GLB mesh layers. Mesh layers control model visibility. Point layers control which learning annotations are visible and included in study or quiz sessions.

## Data Model

Extend `Annotation` with optional learning metadata:

```ts
type AnnotationPointLayer = 'organ' | 'vessels' | 'nerves' | 'clinical' | 'topography'

interface Annotation {
  layerIds?: AnnotationPointLayer[]
  quizPrompt?: string
  acceptedAnswers?: string[]
  difficulty?: 'basic' | 'intermediate' | 'exam'
}
```

`layerIds` drives filtering. `quizPrompt` allows a custom question when "Co to jest?" is too generic. `acceptedAnswers` supports typed-answer quiz mode later, but the first version may use multiple choice. `difficulty` lets the quiz grow without changing the core model.

## State

Add learning state to the existing Zustand store:

- active bottom-panel tab: `points`, `study`, or `quiz`.
- active annotation point layers.
- study index for the current filtered annotation list.
- quiz session state: current question, options, selected answer, answer result, and score.

Changing `selectedStructure` resets study and quiz progress while preserving the global active point-layer filter if possible. If the new structure has no matching annotations, the UI shows an empty state and offers to enable all layers.

## Components

Add small, focused components rather than growing `PanelBottom` into a large file:

- `AnnotationLayerFilter`: multi-select controls for point layers.
- `LearningTabs`: tab switcher for `Punkty`, `Nauka`, and `Quiz`.
- `AnnotationPointList`: browse mode for filtered annotations.
- `StudyModePanel`: guided next/previous study flow.
- `QuizModePanel`: quiz question, answer choices, feedback, and score.

`PanelBottom` coordinates layout and passes filtered annotations to these components. `Viewer3D/Annotations.tsx` uses the same filter state so the 3D markers match the learning panel.

## Study Mode

Study mode walks through the filtered annotation list. Each step shows:

- point number and layer labels.
- Polish label and Latin name.
- description.
- actions: previous, next, mark as remembered.

Selecting a study step sets `activeAnnotation`, making the 3D point pulse in the existing viewer. The first version can keep remembered state in memory only. Persistent progress can be added later once the learning flow feels right.

## Quiz Mode

Quiz mode uses the same filtered annotation list. A question selects one target annotation, highlights its marker in the viewer, and hides the answer until the user responds.

The first quiz version uses multiple choice because it is fast and deterministic. Options come from annotations in the selected structure, with fallback options from other loaded structures if there are too few local annotations. After an answer, the panel shows correct/incorrect feedback, the correct PL/LAT label, and the annotation description.

Quiz score is stored for the current session only:

- answered count.
- correct count.
- current streak.

Typed-answer mode can be added later using `acceptedAnswers`.

## Data Flow

1. `PanelLeft` selects a structure.
2. Store resets active annotation, study index, and quiz state.
3. `PanelBottom` derives `filteredAnnotations` from selected structure annotations and active point layers.
4. `Viewer3D/Annotations.tsx` renders only annotations included by the same filter.
5. Study and quiz panels set `activeAnnotation` to focus the viewer.
6. Quiz panel records the answer result and advances to the next target.

The derived filtering logic should live in a small helper so `PanelBottom` and `Annotations` cannot drift apart.

## Error And Empty States

If a selected structure has no annotations, all three tabs show the existing empty learning message with more specific text.

If active filters hide all annotations, the panel says that no points match the selected layers and provides a button to enable all point layers.

If a quiz cannot build enough answer options, it falls back to a smaller option set instead of blocking the user. The minimum useful quiz question is one correct answer and one distractor.

## Testing

Add focused verification for the learning data and behavior:

- TypeScript compile/build should pass.
- Existing `verify:learning-data` should be extended to accept optional annotation learning metadata.
- Add checks that every `layerIds` value is one of the allowed point layers.
- Add checks that quiz option generation never duplicates the correct answer.
- Manually verify in the app that point-layer filters affect both the 3D markers and the bottom-panel content.

## Initial Scope

The first implementation includes in-memory study progress and in-memory quiz scoring only. It does not include accounts-based progress tracking, spaced repetition, AI-generated quizzes, or database persistence. Those are good later additions after the core workflow is pleasant to use.
