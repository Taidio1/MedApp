# 3D Learning Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build guided study, quiz practice, and annotation point-layer filters for existing 3D anatomy models.

**Architecture:** Add learning metadata to annotations, centralize filtering and quiz option generation in a small helper, store learning UI state in Zustand, and split the bottom learning panel into focused client components. Keep the current `Viewer3D` as the visual anchor and make it render the same filtered annotation set as the bottom panel.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript, Zustand, React Three Fiber, Supabase, Node verification scripts.

---

## File Structure

- Modify `lib/types.ts`: add `AnnotationPointLayer`, `AnnotationDifficulty`, and optional learning metadata on `Annotation`.
- Create `lib/learning.ts`: point-layer definitions, annotation filtering, quiz option generation, quiz question generation, score helpers.
- Modify `lib/store.ts`: add active learning tab, selected point layers, remembered annotation IDs, study index, and quiz session state/actions.
- Create `components/PanelBottom/learningTypes.ts`: UI-only type aliases shared by bottom-panel learning components.
- Create `components/PanelBottom/AnnotationLayerFilter.tsx`: multi-select controls for annotation point layers.
- Create `components/PanelBottom/LearningTabs.tsx`: tabs for `Punkty`, `Nauka`, and `Quiz`.
- Create `components/PanelBottom/AnnotationPointList.tsx`: filtered annotation browsing.
- Create `components/PanelBottom/StudyModePanel.tsx`: guided previous/next study flow.
- Create `components/PanelBottom/QuizModePanel.tsx`: multiple-choice quiz flow and score display.
- Modify `components/PanelBottom/PanelBottom.tsx`: compose the new learning components and derive filtered annotations.
- Modify `components/Viewer3D/Annotations.tsx`: apply the same point-layer filter used by the panel.
- Modify `lib/supabase/structures.ts`: map annotation learning columns from Supabase rows.
- Modify `app/api/admin/annotations/route.ts`: read/write annotation learning metadata for admin edits.
- Modify `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`: edit point layers, quiz prompt, accepted answers, and difficulty.
- Modify `supabase/schema-v0.2.sql`: add annotation learning metadata columns and checks.
- Modify `scripts/verify-learning-data.mjs`: validate optional learning metadata and point layers.
- Add `scripts/verify-learning-ui.mjs`: static verification that the viewer and bottom panel use shared filtering helpers.
- Modify `package.json`: add `verify:learning-ui`.

Before editing Next.js components, read these local docs because this project uses Next.js 16: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`.

---

### Task 1: Learning Types And Pure Logic

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/learning.ts`
- Modify: `scripts/verify-learning-data.mjs`
- Modify: `package.json`

- [ ] **Step 1: Extend shared annotation types**

In `lib/types.ts`, add these exports above `export interface Annotation`:

```ts
export const annotationPointLayers = [
  'organ',
  'vessels',
  'nerves',
  'clinical',
  'topography',
] as const

export type AnnotationPointLayer = (typeof annotationPointLayers)[number]

export const annotationDifficulties = [
  'basic',
  'intermediate',
  'exam',
] as const

export type AnnotationDifficulty = (typeof annotationDifficulties)[number]
```

Then add these optional fields inside `Annotation` after `visible?: boolean`:

```ts
  layerIds?: AnnotationPointLayer[]
  quizPrompt?: string
  acceptedAnswers?: string[]
  difficulty?: AnnotationDifficulty
```

- [ ] **Step 2: Create shared learning helper**

Create `lib/learning.ts`:

```ts
import {
  Annotation,
  AnnotationPointLayer,
  annotationPointLayers,
} from './types'

export type LearningTabId = 'points' | 'study' | 'quiz'

export const learningTabs: { id: LearningTabId; label: string }[] = [
  { id: 'points', label: 'Punkty' },
  { id: 'study', label: 'Nauka' },
  { id: 'quiz', label: 'Quiz' },
]

export const annotationPointLayerLabels: Record<AnnotationPointLayer, string> = {
  organ: 'Narząd',
  vessels: 'Naczynia',
  nerves: 'Nerwy',
  clinical: 'Kliniczne',
  topography: 'Topografia',
}

export const defaultAnnotationPointLayers: AnnotationPointLayer[] = [
  ...annotationPointLayers,
]

export interface QuizQuestion {
  id: string
  prompt: string
  target: Annotation
  options: Annotation[]
}

export interface QuizScore {
  answered: number
  correct: number
  streak: number
}

export function getAnnotationLayerIds(
  annotation: Pick<Annotation, 'layerIds'>,
): AnnotationPointLayer[] {
  if (!annotation.layerIds || annotation.layerIds.length === 0) {
    return ['organ']
  }

  return annotation.layerIds
}

export function annotationMatchesLayers(
  annotation: Annotation,
  activeLayers: AnnotationPointLayer[],
): boolean {
  if (activeLayers.length === 0) return false

  const annotationLayers = getAnnotationLayerIds(annotation)
  return annotationLayers.some((layerId) => activeLayers.includes(layerId))
}

export function filterAnnotationsByLayers(
  annotations: Annotation[],
  activeLayers: AnnotationPointLayer[],
): Annotation[] {
  return annotations.filter(
    (annotation) =>
      annotation.visible !== false &&
      annotationMatchesLayers(annotation, activeLayers),
  )
}

export function toggleAnnotationPointLayer(
  layers: AnnotationPointLayer[],
  layerId: AnnotationPointLayer,
): AnnotationPointLayer[] {
  if (layers.includes(layerId)) {
    return layers.filter((current) => current !== layerId)
  }

  return [...layers, layerId]
}

export function buildQuizOptions(
  target: Annotation,
  localAnnotations: Annotation[],
  fallbackAnnotations: Annotation[],
  optionCount = 4,
): Annotation[] {
  const candidates = [...localAnnotations, ...fallbackAnnotations]
    .filter((annotation) => annotation.id !== target.id)
    .filter((annotation) => annotation.label !== target.label)
    .filter((annotation) => annotation.visible !== false)

  const uniqueCandidates = candidates.filter(
    (annotation, index, all) =>
      all.findIndex((item) => item.label === annotation.label) === index,
  )

  return [target, ...uniqueCandidates].slice(0, optionCount)
}

export function buildQuizQuestion(
  annotations: Annotation[],
  fallbackAnnotations: Annotation[],
  index: number,
): QuizQuestion | null {
  if (annotations.length === 0) return null

  const target = annotations[index % annotations.length]
  const options = buildQuizOptions(target, annotations, fallbackAnnotations)

  if (options.length < 2) return null

  return {
    id: `${target.id}-${index}`,
    prompt: target.quizPrompt?.trim() || 'Co to jest?',
    target,
    options,
  }
}

export function scoreQuizAnswer(
  score: QuizScore,
  isCorrect: boolean,
): QuizScore {
  return {
    answered: score.answered + 1,
    correct: score.correct + (isCorrect ? 1 : 0),
    streak: isCorrect ? score.streak + 1 : 0,
  }
}
```

- [ ] **Step 3: Extend learning data verification**

In `scripts/verify-learning-data.mjs`, add this constant after `modelIds`:

```js
const allowedPointLayers = new Set([
  'organ',
  'vessels',
  'nerves',
  'clinical',
  'topography',
])
```

Add this helper after `findStructureBlock`:

```js
function extractLayerIds(block) {
  const matches = [...block.matchAll(/layerIds:\s*\[([^\]]*)\]/g)]
  return matches.flatMap((match) =>
    match[1]
      .split(',')
      .map((value) => value.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean),
  )
}
```

Add this validation before the final `console.log`:

```js
const invalidLayerIds = []

for (const id of modelIds) {
  const block = findStructureBlock(anatomySource, id)
  if (!block) continue

  for (const layerId of extractLayerIds(block)) {
    if (!allowedPointLayers.has(layerId)) {
      invalidLayerIds.push(`${id}:${layerId}`)
    }
  }
}

if (invalidLayerIds.length > 0) {
  console.error(
    `Nieprawidlowe warstwy punktow edukacyjnych: ${invalidLayerIds.join(', ')}`,
  )
  process.exit(1)
}
```

- [ ] **Step 4: Add static UI verification script**

Create `scripts/verify-learning-ui.mjs`:

```js
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()

function read(path) {
  return readFileSync(join(projectRoot, path), 'utf8')
}

const checks = [
  {
    path: 'components/PanelBottom/PanelBottom.tsx',
    patterns: ['filterAnnotationsByLayers', 'AnnotationLayerFilter', 'QuizModePanel'],
  },
  {
    path: 'components/Viewer3D/Annotations.tsx',
    patterns: ['filterAnnotationsByLayers', 'activeAnnotationPointLayers'],
  },
  {
    path: 'lib/store.ts',
    patterns: ['activeLearningTab', 'activeAnnotationPointLayers', 'quizScore'],
  },
]

const failures = []

for (const check of checks) {
  const source = read(check.path)
  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) failures.push(`${check.path} missing ${pattern}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Learning UI wiring OK.')
```

- [ ] **Step 5: Add package script**

In `package.json`, add this script after `verify:learning-data`:

```json
"verify:learning-ui": "node scripts/verify-learning-ui.mjs",
```

- [ ] **Step 6: Verify Task 1**

Run:

```bash
npm run verify:learning-data
npm run build
```

Expected:

```text
Dane edukacyjne OK: kazdy dostepny model ma minimum 3 anotacje.
```

`npm run build` should complete with exit code `0`.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add lib/types.ts lib/learning.ts scripts/verify-learning-data.mjs scripts/verify-learning-ui.mjs package.json
git commit -m "feat: add learning annotation logic"
```

---

### Task 2: Learning State In Zustand

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 1: Add imports**

In `lib/store.ts`, change the imports to:

```ts
import { create } from 'zustand'
import {
  AnatomicalStructure,
  Annotation,
  AnnotationPointLayer,
  ChatMessage,
} from './types'
import {
  LearningTabId,
  QuizQuestion,
  QuizScore,
  defaultAnnotationPointLayers,
  toggleAnnotationPointLayer,
} from './learning'
```

- [ ] **Step 2: Add state fields to `AppState`**

Add these fields after `splitOpen` in `AppState`:

```ts
  activeLearningTab: LearningTabId
  setActiveLearningTab: (tab: LearningTabId) => void

  activeAnnotationPointLayers: AnnotationPointLayer[]
  setActiveAnnotationPointLayers: (layers: AnnotationPointLayer[]) => void
  toggleAnnotationPointLayer: (layer: AnnotationPointLayer) => void
  enableAllAnnotationPointLayers: () => void

  studyIndex: number
  setStudyIndex: (index: number) => void
  rememberedAnnotationIds: string[]
  toggleRememberedAnnotation: (annotationId: string) => void

  quizQuestion: QuizQuestion | null
  setQuizQuestion: (question: QuizQuestion | null) => void
  selectedQuizAnswerId: string | null
  setSelectedQuizAnswerId: (annotationId: string | null) => void
  quizScore: QuizScore
  setQuizScore: (score: QuizScore) => void
  resetQuiz: () => void
```

- [ ] **Step 3: Reset learning progress on structure change**

Inside `setSelectedStructure`, extend the object passed to `set` with:

```ts
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
      quizScore: { answered: 0, correct: 0, streak: 0 },
```

- [ ] **Step 4: Add store implementations**

Add these state defaults and actions after `setSplitOpen`:

```ts
  activeLearningTab: 'points',
  setActiveLearningTab: (tab) => set({ activeLearningTab: tab }),

  activeAnnotationPointLayers: defaultAnnotationPointLayers,
  setActiveAnnotationPointLayers: (layers) =>
    set({ activeAnnotationPointLayers: layers }),
  toggleAnnotationPointLayer: (layer) =>
    set((state) => ({
      activeAnnotationPointLayers: toggleAnnotationPointLayer(
        state.activeAnnotationPointLayers,
        layer,
      ),
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
    })),
  enableAllAnnotationPointLayers: () =>
    set({
      activeAnnotationPointLayers: defaultAnnotationPointLayers,
      studyIndex: 0,
      quizQuestion: null,
      selectedQuizAnswerId: null,
    }),

  studyIndex: 0,
  setStudyIndex: (index) => set({ studyIndex: index }),
  rememberedAnnotationIds: [],
  toggleRememberedAnnotation: (annotationId) =>
    set((state) => ({
      rememberedAnnotationIds: state.rememberedAnnotationIds.includes(annotationId)
        ? state.rememberedAnnotationIds.filter((id) => id !== annotationId)
        : [...state.rememberedAnnotationIds, annotationId],
    })),

  quizQuestion: null,
  setQuizQuestion: (question) => set({ quizQuestion: question }),
  selectedQuizAnswerId: null,
  setSelectedQuizAnswerId: (annotationId) =>
    set({ selectedQuizAnswerId: annotationId }),
  quizScore: { answered: 0, correct: 0, streak: 0 },
  setQuizScore: (score) => set({ quizScore: score }),
  resetQuiz: () =>
    set({
      quizQuestion: null,
      selectedQuizAnswerId: null,
      quizScore: { answered: 0, correct: 0, streak: 0 },
    }),
```

- [ ] **Step 5: Verify Task 2**

Run:

```bash
npm run build
```

Expected: build exits with code `0`.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add lib/store.ts
git commit -m "feat: add learning mode state"
```

---

### Task 3: Bottom Panel Learning Components

**Files:**
- Create: `components/PanelBottom/learningTypes.ts`
- Create: `components/PanelBottom/AnnotationLayerFilter.tsx`
- Create: `components/PanelBottom/LearningTabs.tsx`
- Create: `components/PanelBottom/AnnotationPointList.tsx`
- Create: `components/PanelBottom/StudyModePanel.tsx`
- Create: `components/PanelBottom/QuizModePanel.tsx`
- Modify: `components/PanelBottom/PanelBottom.tsx`

- [ ] **Step 1: Add local panel type**

Create `components/PanelBottom/learningTypes.ts`:

```ts
export interface LearningMetricProps {
  label: string
  value: string | number
}
```

- [ ] **Step 2: Add point-layer filter component**

Create `components/PanelBottom/AnnotationLayerFilter.tsx`:

```tsx
'use client'

import { AnnotationPointLayer, annotationPointLayers } from '@/lib/types'
import { annotationPointLayerLabels } from '@/lib/learning'

interface AnnotationLayerFilterProps {
  activeLayers: AnnotationPointLayer[]
  onToggleLayer: (layer: AnnotationPointLayer) => void
  onEnableAll: () => void
}

export function AnnotationLayerFilter({
  activeLayers,
  onToggleLayer,
  onEnableAll,
}: AnnotationLayerFilterProps) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {annotationPointLayers.map((layerId) => {
        const active = activeLayers.includes(layerId)

        return (
          <button
            key={layerId}
            type="button"
            aria-pressed={active}
            onClick={() => onToggleLayer(layerId)}
            className={[
              'h-7 flex-shrink-0 rounded-md border px-2.5 text-[10px] font-semibold transition-colors',
              active
                ? 'border-[#7c3aed] bg-[#ede9fe] text-[#5b21b6]'
                : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#c4b5fd]',
            ].join(' ')}
          >
            {annotationPointLayerLabels[layerId]}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onEnableAll}
        className="h-7 flex-shrink-0 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-[10px] font-semibold text-[#6b7280] hover:border-[#c4b5fd]"
      >
        Wszystkie
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Add tabs component**

Create `components/PanelBottom/LearningTabs.tsx`:

```tsx
'use client'

import { LearningTabId, learningTabs } from '@/lib/learning'

interface LearningTabsProps {
  activeTab: LearningTabId
  onChange: (tab: LearningTabId) => void
}

export function LearningTabs({ activeTab, onChange }: LearningTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {learningTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'h-7 rounded-md px-3 text-[11px] font-semibold transition-colors',
            activeTab === tab.id
              ? 'bg-[#7c3aed] text-white shadow-[0_8px_18px_rgba(124,58,237,0.18)]'
              : 'bg-white text-[#6b7280] hover:bg-[#f4f0ff]',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Add annotation browsing component**

Create `components/PanelBottom/AnnotationPointList.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { Annotation } from '@/lib/types'
import { annotationPointLayerLabels, getAnnotationLayerIds } from '@/lib/learning'

interface AnnotationPointListProps {
  annotations: Annotation[]
  activeAnnotation: Annotation | null
  onSelectAnnotation: (annotation: Annotation) => void
}

export function AnnotationPointList({
  annotations,
  activeAnnotation,
  onSelectAnnotation,
}: AnnotationPointListProps) {
  if (annotations.length === 0) {
    return (
      <div className="flex h-full items-center rounded-md border border-dashed border-[#d1d5db] px-4 text-xs text-[#9ca3af]">
        Brak punktów dla wybranych warstw.
      </div>
    )
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
      {annotations.slice(0, 4).map((annotation, index) => {
        const isActive = activeAnnotation?.id === annotation.id
        const layerLabel = getAnnotationLayerIds(annotation)
          .map((layerId) => annotationPointLayerLabels[layerId])
          .join(', ')

        return (
          <button
            key={annotation.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectAnnotation(annotation)}
            className={[
              'group min-w-0 rounded-md border px-3 py-2 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200',
              'hover:-translate-y-0.5 hover:border-[#7c3aed]/45 hover:shadow-[0_8px_22px_rgba(124,58,237,0.14)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]',
              isActive
                ? 'border-[#7c3aed] bg-[#f4f0ff] shadow-[0_10px_28px_rgba(124,58,237,0.18)]'
                : 'border-[#e5e7eb] bg-white',
            ].join(' ')}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className={[
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform duration-200',
                  isActive ? 'scale-110 bg-[#f59e0b]' : 'bg-[#7c3aed] group-hover:scale-105',
                ].join(' ')}
              >
                {index + 1}
              </span>
              <span className="truncate text-xs font-semibold text-[#111827]">
                {annotation.label}
              </span>
            </div>
            <p className="truncate text-[10px] italic text-[#7c3aed]">
              {annotation.nameLAT ?? 'Nazwa łacińska w opracowaniu'}
            </p>
            <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">
              {layerLabel}
            </p>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Add guided study component**

Create `components/PanelBottom/StudyModePanel.tsx`:

```tsx
'use client'

import { Annotation } from '@/lib/types'
import { annotationPointLayerLabels, getAnnotationLayerIds } from '@/lib/learning'

interface StudyModePanelProps {
  annotations: Annotation[]
  activeAnnotation: Annotation | null
  studyIndex: number
  rememberedAnnotationIds: string[]
  onSetStudyIndex: (index: number) => void
  onSelectAnnotation: (annotation: Annotation) => void
  onToggleRemembered: (annotationId: string) => void
}

export function StudyModePanel({
  annotations,
  activeAnnotation,
  studyIndex,
  rememberedAnnotationIds,
  onSetStudyIndex,
  onSelectAnnotation,
  onToggleRemembered,
}: StudyModePanelProps) {
  const safeIndex = annotations.length > 0
    ? Math.min(studyIndex, annotations.length - 1)
    : 0
  const annotation = annotations[safeIndex] ?? null

  useEffect(() => {
    if (annotation && activeAnnotation?.id !== annotation.id) {
      onSelectAnnotation(annotation)
    }
  }, [activeAnnotation?.id, annotation, onSelectAnnotation])

  if (annotations.length === 0) {
    return (
      <div className="flex h-full items-center rounded-md border border-dashed border-[#d1d5db] px-4 text-xs text-[#9ca3af]">
        Włącz warstwy z punktami, aby rozpocząć naukę.
      </div>
    )
  }

  if (!annotation) return null

  const remembered = rememberedAnnotationIds.includes(annotation.id)
  const layers = getAnnotationLayerIds(annotation)
    .map((layerId) => annotationPointLayerLabels[layerId])
    .join(', ')

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto] gap-3 rounded-md border border-[#e5e7eb] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Krok {safeIndex + 1} z {annotations.length} · {layers}
        </p>
        <h3 className="mt-1 truncate text-sm font-bold text-[#111827]">
          {annotation.label}
        </h3>
        <p className="truncate text-[11px] italic text-[#7c3aed]">
          {annotation.nameLAT ?? 'Nazwa łacińska w opracowaniu'}
        </p>
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#6b7280]">
          {annotation.description ?? 'Opis tego punktu jest w opracowaniu.'}
        </p>
      </div>
      <div className="flex w-[168px] flex-col justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleRemembered(annotation.id)}
          className={[
            'h-8 rounded-md border text-[11px] font-semibold',
            remembered
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]',
          ].join(' ')}
        >
          {remembered ? 'Zapamiętane' : 'Oznacz jako znane'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetStudyIndex(Math.max(0, safeIndex - 1))}
            className="h-8 rounded-md border border-[#e5e7eb] bg-[#f9fafb] text-[11px] font-semibold text-[#6b7280]"
          >
            Wstecz
          </button>
          <button
            type="button"
            onClick={() => onSetStudyIndex((safeIndex + 1) % annotations.length)}
            className="h-8 rounded-md bg-[#7c3aed] text-[11px] font-semibold text-white"
          >
            Dalej
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add quiz component**

Create `components/PanelBottom/QuizModePanel.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { Annotation } from '@/lib/types'
import {
  QuizQuestion,
  QuizScore,
  buildQuizQuestion,
  scoreQuizAnswer,
} from '@/lib/learning'

interface QuizModePanelProps {
  annotations: Annotation[]
  fallbackAnnotations: Annotation[]
  question: QuizQuestion | null
  selectedAnswerId: string | null
  score: QuizScore
  onSetQuestion: (question: QuizQuestion | null) => void
  onSetSelectedAnswer: (annotationId: string | null) => void
  onSetScore: (score: QuizScore) => void
  onSelectAnnotation: (annotation: Annotation) => void
}

export function QuizModePanel({
  annotations,
  fallbackAnnotations,
  question,
  selectedAnswerId,
  score,
  onSetQuestion,
  onSetSelectedAnswer,
  onSetScore,
  onSelectAnnotation,
}: QuizModePanelProps) {
  useEffect(() => {
    if (!question) {
      const next = buildQuizQuestion(annotations, fallbackAnnotations, score.answered)
      onSetQuestion(next)
      if (next) onSelectAnnotation(next.target)
    }
  }, [annotations, fallbackAnnotations, onSelectAnnotation, onSetQuestion, question, score.answered])

  if (annotations.length === 0) {
    return (
      <div className="flex h-full items-center rounded-md border border-dashed border-[#d1d5db] px-4 text-xs text-[#9ca3af]">
        Quiz potrzebuje widocznych punktów z wybranych warstw.
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex h-full items-center rounded-md border border-dashed border-[#d1d5db] px-4 text-xs text-[#9ca3af]">
        Ten zestaw potrzebuje co najmniej dwóch odpowiedzi do quizu.
      </div>
    )
  }

  const answered = selectedAnswerId != null
  const correct = selectedAnswerId === question.target.id

  const handleAnswer = (answerId: string) => {
    if (answered) return
    const isCorrect = answerId === question.target.id
    onSetSelectedAnswer(answerId)
    onSetScore(scoreQuizAnswer(score, isCorrect))
  }

  const handleNext = () => {
    onSetSelectedAnswer(null)
    const next = buildQuizQuestion(annotations, fallbackAnnotations, score.answered)
    onSetQuestion(next)
    if (next) onSelectAnnotation(next.target)
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[1fr_170px] gap-3">
      <div className="rounded-md border border-[#e5e7eb] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Pytanie {score.answered + 1}
        </p>
        <h3 className="mt-1 text-sm font-bold text-[#111827]">{question.prompt}</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {question.options.map((option) => {
            const selected = selectedAnswerId === option.id
            const isTarget = option.id === question.target.id

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAnswer(option.id)}
                className={[
                  'min-h-8 rounded-md border px-2 text-left text-[11px] font-semibold transition-colors',
                  answered && isTarget
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : selected
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#c4b5fd]',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-[#e5e7eb] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Wynik
        </p>
        <p className="text-sm font-bold text-[#111827]">
          {score.correct}/{score.answered}
        </p>
        <p className="text-[11px] text-[#6b7280]">Seria: {score.streak}</p>
        {answered && (
          <p className={correct ? 'text-[11px] text-emerald-700' : 'text-[11px] text-red-700'}>
            {correct ? 'Dobrze.' : `Poprawnie: ${question.target.label}`}
          </p>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="mt-auto h-8 rounded-md bg-[#7c3aed] text-[11px] font-semibold text-white"
        >
          Następne
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Compose new bottom panel**

Modify `components/PanelBottom/PanelBottom.tsx` by importing the new components and helpers:

```tsx
import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { filterAnnotationsByLayers } from '@/lib/learning'
import { AnnotationLayerFilter } from './AnnotationLayerFilter'
import { LearningTabs } from './LearningTabs'
import { AnnotationPointList } from './AnnotationPointList'
import { StudyModePanel } from './StudyModePanel'
import { QuizModePanel } from './QuizModePanel'
```

Inside `PanelBottom`, read these store fields:

```ts
  const structures = useAppStore((state) => state.structures)
  const activeLearningTab = useAppStore((state) => state.activeLearningTab)
  const setActiveLearningTab = useAppStore((state) => state.setActiveLearningTab)
  const activeAnnotationPointLayers = useAppStore((state) => state.activeAnnotationPointLayers)
  const toggleAnnotationPointLayer = useAppStore((state) => state.toggleAnnotationPointLayer)
  const enableAllAnnotationPointLayers = useAppStore((state) => state.enableAllAnnotationPointLayers)
  const studyIndex = useAppStore((state) => state.studyIndex)
  const setStudyIndex = useAppStore((state) => state.setStudyIndex)
  const rememberedAnnotationIds = useAppStore((state) => state.rememberedAnnotationIds)
  const toggleRememberedAnnotation = useAppStore((state) => state.toggleRememberedAnnotation)
  const quizQuestion = useAppStore((state) => state.quizQuestion)
  const setQuizQuestion = useAppStore((state) => state.setQuizQuestion)
  const selectedQuizAnswerId = useAppStore((state) => state.selectedQuizAnswerId)
  const setSelectedQuizAnswerId = useAppStore((state) => state.setSelectedQuizAnswerId)
  const quizScore = useAppStore((state) => state.quizScore)
  const setQuizScore = useAppStore((state) => state.setQuizScore)
```

Add derived annotations:

```ts
  const filteredAnnotations = useMemo(
    () => filterAnnotationsByLayers(annotations, activeAnnotationPointLayers),
    [annotations, activeAnnotationPointLayers],
  )
  const fallbackAnnotations = useMemo(
    () =>
      Object.values(structures)
        .flatMap((structure) => structure.annotations)
        .filter((annotation) => annotation.structureId !== selectedStructure?.id),
    [structures, selectedStructure?.id],
  )
```

Replace the selected-structure branch with a header containing `LearningTabs`, `AnnotationLayerFilter`, and a conditional body:

```tsx
          <div className="flex min-w-0 flex-1 flex-col px-5 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  Mapa nauki
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">
                  {selectedStructure.namePL} · {selectedStructure.nameLAT}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LearningTabs activeTab={activeLearningTab} onChange={setActiveLearningTab} />
                <span className="rounded-full bg-[#ede9fe] px-2.5 py-1 text-[10px] font-semibold text-[#6d28d9]">
                  {filteredAnnotations.length}/{annotations.length} punkty
                </span>
              </div>
            </div>

            <div className="mb-2">
              <AnnotationLayerFilter
                activeLayers={activeAnnotationPointLayers}
                onToggleLayer={toggleAnnotationPointLayer}
                onEnableAll={enableAllAnnotationPointLayers}
              />
            </div>

            {activeLearningTab === 'points' && (
              <AnnotationPointList
                annotations={filteredAnnotations}
                activeAnnotation={activeAnnotationInStructure}
                onSelectAnnotation={setActiveAnnotation}
              />
            )}
            {activeLearningTab === 'study' && (
              <StudyModePanel
                annotations={filteredAnnotations}
                activeAnnotation={activeAnnotationInStructure}
                studyIndex={studyIndex}
                rememberedAnnotationIds={rememberedAnnotationIds}
                onSetStudyIndex={setStudyIndex}
                onSelectAnnotation={setActiveAnnotation}
                onToggleRemembered={toggleRememberedAnnotation}
              />
            )}
            {activeLearningTab === 'quiz' && (
              <QuizModePanel
                annotations={filteredAnnotations}
                fallbackAnnotations={fallbackAnnotations}
                question={quizQuestion}
                selectedAnswerId={selectedQuizAnswerId}
                score={quizScore}
                onSetQuestion={setQuizQuestion}
                onSetSelectedAnswer={setSelectedQuizAnswerId}
                onSetScore={setQuizScore}
                onSelectAnnotation={setActiveAnnotation}
              />
            )}
          </div>
```

- [ ] **Step 8: Verify Task 3**

Run:

```bash
npm run build
```

Expected: build exits with code `0`.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add components/PanelBottom lib/store.ts
git commit -m "feat: add learning bottom panel"
```

---

### Task 4: Apply Point-Layer Filters In 3D Viewer

**Files:**
- Modify: `components/Viewer3D/Annotations.tsx`

- [ ] **Step 1: Import shared filter**

Add this import:

```ts
import { filterAnnotationsByLayers } from '@/lib/learning'
```

- [ ] **Step 2: Use store filter state**

Change the first line of `Annotations` from:

```ts
  const { selectedStructure } = useAppStore()
```

to:

```ts
  const { selectedStructure, activeAnnotationPointLayers } = useAppStore()
```

Replace the rendered annotation map with:

```tsx
      {filterAnnotationsByLayers(
        selectedStructure.annotations,
        activeAnnotationPointLayers,
      ).map((annotation) => (
        <AnnotationPoint key={annotation.id} annotation={annotation} />
      ))}
```

- [ ] **Step 3: Verify Task 4**

Run:

```bash
npm run verify:learning-ui
npm run build
```

Expected:

```text
Learning UI wiring OK.
```

`npm run build` should complete with exit code `0`.

- [ ] **Step 4: Commit Task 4**

Run:

```bash
git add components/Viewer3D/Annotations.tsx scripts/verify-learning-ui.mjs
git commit -m "feat: filter 3d learning points by layer"
```

---

### Task 5: Supabase Mapping And Schema

**Files:**
- Modify: `supabase/schema-v0.2.sql`
- Modify: `lib/supabase/structures.ts`

- [ ] **Step 1: Add schema columns**

In `supabase/schema-v0.2.sql`, add these columns to `public.annotations` after `visible boolean not null default true`:

```sql
  layer_ids text[] not null default array['organ']::text[],
  quiz_prompt text,
  accepted_answers text[] not null default array[]::text[],
  difficulty text check (difficulty in ('basic', 'intermediate', 'exam')),
```

Add this constraint after `annotations_size_range`:

```sql
  constraint annotations_layer_ids_allowed
    check (
      layer_ids <@ array['organ', 'vessels', 'nerves', 'clinical', 'topography']::text[]
      and cardinality(layer_ids) >= 1
    )
```

Update the seed insert column list for `public.annotations` by adding:

```sql
  layer_ids,
  quiz_prompt,
  accepted_answers,
  difficulty
```

For each seed row, add:

```sql
    array['organ']::text[],
    null,
    array[]::text[],
    'basic'
```

Update the `on conflict` clause with:

```sql
  layer_ids = excluded.layer_ids,
  quiz_prompt = excluded.quiz_prompt,
  accepted_answers = excluded.accepted_answers,
  difficulty = excluded.difficulty;
```

- [ ] **Step 2: Map learning columns in Supabase fetch**

In `lib/supabase/structures.ts`, update imports:

```ts
import {
  AnatomicalStructure,
  Annotation,
  AnnotationDifficulty,
  AnnotationPointLayer,
  AnatomyLayer,
} from '@/lib/types'
```

Extend `AnnotationRow`:

```ts
  layer_ids: string[] | null
  quiz_prompt: string | null
  accepted_answers: string[] | null
  difficulty: string | null
```

Add these helpers above `mapAnnotation`:

```ts
const allowedPointLayers = new Set([
  'organ',
  'vessels',
  'nerves',
  'clinical',
  'topography',
])

const allowedDifficulties = new Set(['basic', 'intermediate', 'exam'])

function mapLayerIds(value: string[] | null): AnnotationPointLayer[] {
  const layers = (value ?? []).filter((layer): layer is AnnotationPointLayer =>
    allowedPointLayers.has(layer),
  )

  return layers.length > 0 ? layers : ['organ']
}

function mapDifficulty(value: string | null): AnnotationDifficulty | undefined {
  return value != null && allowedDifficulties.has(value)
    ? (value as AnnotationDifficulty)
    : undefined
}
```

Extend the object returned by `mapAnnotation`:

```ts
    layerIds: mapLayerIds(row.layer_ids),
    ...(row.quiz_prompt != null ? { quizPrompt: row.quiz_prompt } : {}),
    ...(row.accepted_answers != null ? { acceptedAnswers: row.accepted_answers } : {}),
    ...(mapDifficulty(row.difficulty) ? { difficulty: mapDifficulty(row.difficulty) } : {}),
```

Update the Supabase select string for `annotations`:

```ts
      annotations (annotation_key, label, name_lat, description, position, size, visible, layer_ids, quiz_prompt, accepted_answers, difficulty)
```

- [ ] **Step 3: Verify Task 5**

Run:

```bash
npm run build
```

Expected: build exits with code `0`.

- [ ] **Step 4: Commit Task 5**

Run:

```bash
git add supabase/schema-v0.2.sql lib/supabase/structures.ts
git commit -m "feat: map annotation learning metadata"
```

---

### Task 6: Admin Annotation Metadata Editing

**Files:**
- Modify: `app/api/admin/annotations/route.ts`
- Modify: `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`

- [ ] **Step 1: Extend admin route types**

In `app/api/admin/annotations/route.ts`, import learning types:

```ts
import {
  AnnotationDifficulty,
  AnnotationPointLayer,
  annotationDifficulties,
  annotationPointLayers,
} from '@/lib/types'
```

Extend `AnnotationRecord`:

```ts
  layerIds?: AnnotationPointLayer[]
  quizPrompt?: string
  acceptedAnswers?: string[]
  difficulty?: AnnotationDifficulty
```

Add these helpers after constants:

```ts
const allowedPointLayers = new Set<string>(annotationPointLayers)
const allowedDifficulties = new Set<string>(annotationDifficulties)

function sanitizeLayerIds(value: unknown): AnnotationPointLayer[] {
  if (!Array.isArray(value)) return ['organ']
  const layers = value.filter(
    (layer): layer is AnnotationPointLayer =>
      typeof layer === 'string' && allowedPointLayers.has(layer),
  )
  return layers.length > 0 ? layers : ['organ']
}

function sanitizeAcceptedAnswers(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((answer): answer is string => typeof answer === 'string')
    .map((answer) => answer.trim())
    .filter(Boolean)
}

function sanitizeDifficulty(value: unknown): AnnotationDifficulty {
  return typeof value === 'string' && allowedDifficulties.has(value)
    ? (value as AnnotationDifficulty)
    : 'basic'
}
```

- [ ] **Step 2: Read learning columns**

Change the admin GET annotations select to:

```ts
        .select('structure_id, annotation_key, label, name_lat, description, position, size, visible, layer_ids, quiz_prompt, accepted_answers, difficulty')
```

Extend the pushed record:

```ts
        layerIds: sanitizeLayerIds(row.layer_ids),
        ...(row.quiz_prompt != null ? { quizPrompt: row.quiz_prompt as string } : {}),
        acceptedAnswers: sanitizeAcceptedAnswers(row.accepted_answers),
        difficulty: sanitizeDifficulty(row.difficulty),
```

- [ ] **Step 3: Write learning columns**

Extend inserted `rows`:

```ts
        layer_ids: sanitizeLayerIds(a.layerIds),
        quiz_prompt: typeof a.quizPrompt === 'string' && a.quizPrompt.trim()
          ? a.quizPrompt.trim()
          : null,
        accepted_answers: sanitizeAcceptedAnswers(a.acceptedAnswers),
        difficulty: sanitizeDifficulty(a.difficulty),
```

- [ ] **Step 4: Extend admin editor record types**

In `components/AdminAnnotationEditor/AdminAnnotationEditor.tsx`, import:

```ts
import {
  Annotation,
  AnnotationDifficulty,
  AnnotationPointLayer,
  annotationDifficulties,
  annotationPointLayers,
} from '@/lib/types'
import { annotationPointLayerLabels, toggleAnnotationPointLayer } from '@/lib/learning'
```

Extend `AnnotationStoreRecord`:

```ts
  layerIds?: AnnotationPointLayer[]
  quizPrompt?: string
  acceptedAnswers?: string[]
  difficulty?: AnnotationDifficulty
```

Extend `annotationToStore`:

```ts
    layerIds: annotation.layerIds,
    quizPrompt: annotation.quizPrompt,
    acceptedAnswers: annotation.acceptedAnswers,
    difficulty: annotation.difficulty,
```

In `addAnnotation`, add defaults:

```ts
      layerIds: ['organ'],
      acceptedAnswers: [],
      difficulty: 'basic',
```

- [ ] **Step 5: Add admin inspector controls**

In the selected annotation inspector, insert this block after the description field:

```tsx
              <Field label="Warstwy punktu">
                <div className="grid grid-cols-2 gap-2">
                  {annotationPointLayers.map((layerId) => {
                    const active = (selectedAnnotation.layerIds ?? ['organ']).includes(layerId)
                    return (
                      <label
                        key={layerId}
                        className="flex items-center gap-2 rounded border border-[#d8d0c3] bg-white px-2 py-1.5 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            patchAnnotation(selectedAnnotation.id, {
                              layerIds: toggleAnnotationPointLayer(
                                selectedAnnotation.layerIds ?? ['organ'],
                                layerId,
                              ),
                            })
                          }
                          className="h-3.5 w-3.5 accent-[#7c3aed]"
                        />
                        {annotationPointLayerLabels[layerId]}
                      </label>
                    )
                  })}
                </div>
              </Field>

              <Field label="Pytanie quizowe">
                <input
                  value={selectedAnnotation.quizPrompt ?? ''}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      quizPrompt: event.target.value,
                    })
                  }
                  className="w-full rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
                />
              </Field>

              <Field label="Akceptowane odpowiedzi">
                <input
                  value={(selectedAnnotation.acceptedAnswers ?? []).join(', ')}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      acceptedAnswers: event.target.value
                        .split(',')
                        .map((answer) => answer.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
                />
              </Field>

              <Field label="Trudność">
                <select
                  value={selectedAnnotation.difficulty ?? 'basic'}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      difficulty: event.target.value as AnnotationDifficulty,
                    })
                  }
                  className="w-full rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
                >
                  {annotationDifficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </Field>
```

- [ ] **Step 6: Verify Task 6**

Run:

```bash
npm run build
```

Expected: build exits with code `0`.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add app/api/admin/annotations/route.ts components/AdminAnnotationEditor/AdminAnnotationEditor.tsx
git commit -m "feat: edit annotation learning metadata"
```

---

### Task 7: End-To-End Verification

**Files:**
- No file edits required unless verification exposes a defect.

- [ ] **Step 1: Run data checks**

Run:

```bash
npm run verify:learning-data
npm run verify:learning-ui
```

Expected:

```text
Dane edukacyjne OK: kazdy dostepny model ma minimum 3 anotacje.
Learning UI wiring OK.
```

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build exits with code `0`.

- [ ] **Step 3: Start dev server**

Run:

```bash
npm run dev
```

Expected:

```text
Local:        http://localhost:3000
```

- [ ] **Step 4: Manual browser verification**

Open `http://localhost:3000`, sign in with an existing account, select a model with annotations, and verify:

- `Punkty`, `Nauka`, and `Quiz` tabs switch without losing the selected structure.
- Point-layer chips hide and show both bottom-panel cards and 3D annotation markers.
- `Nauka` selects the active 3D point when moving next and previous.
- `Quiz` highlights the target point, records correct and incorrect answers, and updates score.
- Admin annotation editor preserves existing points and can save layer metadata.

- [ ] **Step 5: Fix verified defects**

For each defect found in Step 4, make the smallest edit in the file that owns the behavior, then rerun:

```bash
npm run verify:learning-data
npm run verify:learning-ui
npm run build
```

Expected: both verification scripts print OK messages and build exits with code `0`.

- [ ] **Step 6: Commit final fixes**

If Step 5 changed files, run:

```bash
git add .
git commit -m "fix: stabilize learning modes"
```

If Step 5 changed no files, do not create an empty commit.
