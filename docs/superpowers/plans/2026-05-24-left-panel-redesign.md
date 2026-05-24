# Left Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the left panel's anatomy tree dynamic (from API), mode-aware (points/study/quiz badges), and enriched with difficulty indicators.

**Architecture:** `buildAnatomyTree(structures)` replaces the static `anatomyTree` export — it derives the tree from API data grouped by `structure.system`, using a static `SYSTEM_META` config for icons and ordering. `PanelLeft` subscribes to `activeLearningTab`, `rememberedAnnotationIds`, and `quizScore` from the store and passes them down to `TreeNode` which renders mode-specific badges and a context summary.

**Tech Stack:** Next.js 16, React 19, Zustand, TypeScript, CSS custom properties

---

## File Map

| File | Change |
|---|---|
| `lib/anatomyData.ts` | Replace static `baseAnatomyTree`/`anatomyTree` with `SYSTEM_META` + `buildAnatomyTree()` |
| `components/PanelLeft/PanelLeft.tsx` | Full rewrite — dynamic tree, mode-aware badges, difficulty dots, context summary |
| `app/globals.css` | Add `.structure-badge`, `.difficulty-dots`, `.diff-dot` variants, `.study-progress-wrap/bar`, `.context-summary`; fix `.structure-row` grid column |

---

## Task 1: Refactor `lib/anatomyData.ts`

**Files:**
- Modify: `lib/anatomyData.ts`

- [ ] **Step 1: Replace file contents**

Replace the entire file with:

```ts
import { AnatomyNode, AnatomicalStructure } from './types'

export const SYSTEM_META = [
  { systemKey: 'Układ Krążenia',  label: 'Układ Krążenia',  icon: '♥',  order: 1 },
  { systemKey: 'Układ Oddechowy', label: 'Układ Oddechowy', icon: '🫁', order: 2 },
  { systemKey: 'Układ Pokarmowy', label: 'Układ Pokarmowy', icon: '🍽', order: 3 },
  { systemKey: 'Układ Moczowy',   label: 'Układ Moczowy',   icon: '🫘', order: 4 },
] as const

export function buildAnatomyTree(
  structures: Record<string, AnatomicalStructure>,
): AnatomyNode[] {
  const bySystem = new Map<string, AnatomicalStructure[]>()

  for (const structure of Object.values(structures)) {
    const group = bySystem.get(structure.system) ?? []
    group.push(structure)
    bySystem.set(structure.system, group)
  }

  const knownKeys = new Set(SYSTEM_META.map(m => m.systemKey))

  const knownNodes: AnatomyNode[] = SYSTEM_META
    .filter(meta => bySystem.has(meta.systemKey))
    .sort((a, b) => a.order - b.order)
    .map(meta => ({
      id: meta.systemKey,
      label: meta.label,
      icon: meta.icon,
      children: (bySystem.get(meta.systemKey) ?? [])
        .sort((a, b) => a.namePL.localeCompare(b.namePL, 'pl'))
        .map(s => ({ id: s.id, label: s.namePL, structureId: s.id })),
    }))

  const unknownNodes: AnatomyNode[] = []
  for (const [key, structs] of bySystem.entries()) {
    if (!knownKeys.has(key)) {
      unknownNodes.push({
        id: key,
        label: key,
        children: structs
          .sort((a, b) => a.namePL.localeCompare(b.namePL, 'pl'))
          .map(s => ({ id: s.id, label: s.namePL, structureId: s.id })),
      })
    }
  }

  return [...knownNodes, ...unknownNodes]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors from `lib/anatomyData.ts`. If errors appear in `PanelLeft.tsx` about missing `anatomyTree` import — those will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add lib/anatomyData.ts
git commit -m "refactor: replace static anatomyTree with buildAnatomyTree from API structures"
```

---

## Task 2: Add CSS styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Fix `.structure-row` grid column**

Find this line in `.structure-row`:
```css
grid-template-columns: 58px minmax(0, 1fr) 28px;
```
Change it to:
```css
grid-template-columns: 58px minmax(0, 1fr) auto;
```

- [ ] **Step 2: Add new classes before the `@media` blocks**

Find the line `.favorite-dot {` and add the following block **immediately before** it (before the `.favorite-dot` class):

```css
.structure-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(91, 78, 60, 0.08);
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  min-width: 32px;
  transition:
    background 180ms ease,
    color 180ms ease;
}

.structure-row.is-active .structure-badge,
.structure-row:hover .structure-badge {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.difficulty-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.diff-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
  opacity: 0.8;
}

.diff-dot--basic       { background: #4caf50; }
.diff-dot--intermediate { background: #ff9800; }
.diff-dot--exam        { background: #e53935; }

.study-progress-wrap {
  height: 3px;
  border-radius: 999px;
  background: rgba(91, 78, 60, 0.12);
  overflow: hidden;
}

.study-progress-bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 400ms ease;
}

.context-summary {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.02rem;
  line-height: 1.5;
  color: #4b4236;
}

```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add badge, difficulty dots, study progress, context summary styles"
```

---

## Task 3: Rewrite `components/PanelLeft/PanelLeft.tsx`

**Files:**
- Modify: `components/PanelLeft/PanelLeft.tsx`

- [ ] **Step 1: Replace file contents**

Replace the entire file with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AnatomyNode, AnatomicalStructure } from '@/lib/types'
import { buildAnatomyTree } from '@/lib/anatomyData'
import { useAppStore } from '@/lib/store'
import { LearningTabId, QuizScore } from '@/lib/learning'

function getDifficultyDots(structure: AnatomicalStructure) {
  const visible = structure.annotations.filter(a => a.visible !== false)
  return {
    basic: visible.some(a => !a.difficulty || a.difficulty === 'basic'),
    intermediate: visible.some(a => a.difficulty === 'intermediate'),
    exam: visible.some(a => a.difficulty === 'exam'),
  }
}

function getStructureBadge(
  structure: AnatomicalStructure,
  tab: LearningTabId,
  rememberedIds: string[],
  quizScore: QuizScore,
  isSelected: boolean,
): string {
  const visible = structure.annotations.filter(a => a.visible !== false)
  const total = visible.length

  if (tab === 'study') {
    const remembered = visible.filter(a => rememberedIds.includes(a.id)).length
    return `${remembered}/${total}`
  }

  if (tab === 'quiz' && isSelected && quizScore.answered > 0) {
    return `${quizScore.correct}/${quizScore.answered}`
  }

  return `${total} pkt`
}

function getContextSummary(
  structure: AnatomicalStructure | null,
  tab: LearningTabId,
  rememberedIds: string[],
  quizScore: QuizScore,
): string {
  if (!structure) return 'Wybierz strukturę z listy powyżej.'

  const visible = structure.annotations.filter(a => a.visible !== false)
  const total = visible.length

  if (tab === 'points') {
    const suffix = total === 1 ? '' : total < 5 ? 'y' : 'ów'
    return `${structure.namePL} · ${total} punkt${suffix} anatomicznych`
  }

  if (tab === 'study') {
    const remembered = visible.filter(a => rememberedIds.includes(a.id)).length
    return `Zapamiętałeś ${remembered} z ${total} punktów. Kontynuuj naukę poniżej.`
  }

  if (quizScore.answered === 0) return `${structure.namePL} · Rozpocznij quiz poniżej.`
  return `Wynik quizu: ${quizScore.correct}/${quizScore.answered} poprawnych · seria ${quizScore.streak} ✓`
}

function DifficultyDots({ structure }: { structure: AnatomicalStructure }) {
  const dots = getDifficultyDots(structure)
  if (!dots.basic && !dots.intermediate && !dots.exam) return null
  return (
    <span className="difficulty-dots">
      {dots.basic && <span className="diff-dot diff-dot--basic" title="Podstawowy" />}
      {dots.intermediate && <span className="diff-dot diff-dot--intermediate" title="Średni" />}
      {dots.exam && <span className="diff-dot diff-dot--exam" title="Egzaminacyjny" />}
    </span>
  )
}

function StudyProgressBar({
  structure,
  rememberedIds,
}: {
  structure: AnatomicalStructure
  rememberedIds: string[]
}) {
  const visible = structure.annotations.filter(a => a.visible !== false)
  const pct =
    visible.length > 0
      ? (visible.filter(a => rememberedIds.includes(a.id)).length / visible.length) * 100
      : 0
  return (
    <span className="study-progress-wrap">
      <span className="study-progress-bar" style={{ width: `${pct}%` }} />
    </span>
  )
}

interface TreeNodeProps {
  node: AnatomyNode
  depth?: number
  tab: LearningTabId
  rememberedIds: string[]
  quizScore: QuizScore
  selectedStructureId: string | null
  structures: Record<string, AnatomicalStructure>
}

function TreeNode({
  node,
  depth = 0,
  tab,
  rememberedIds,
  quizScore,
  selectedStructureId,
  structures,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const { setSelectedStructure } = useAppStore()

  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isActive = selectedStructureId === node.structureId
  const structure = node.structureId ? structures[node.structureId] : undefined

  const handleClick = () => {
    if (hasChildren) setExpanded(prev => !prev)
    if (node.structureId && structures[node.structureId]) {
      setSelectedStructure(structures[node.structureId])
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={[
          depth === 0 ? 'organelle-row' : 'structure-row',
          isActive ? 'is-active' : '',
        ].join(' ')}
        style={
          depth === 0
            ? { paddingLeft: `${depth * 10 + 8}px` }
            : { paddingLeft: `${depth * 10 + 10}px` }
        }
      >
        {depth === 0 ? (
          <>
            <span className="color-dot" />
            <span className="min-w-0 truncate">
              {node.icon ? `${node.icon} ` : ''}
              {node.label}
            </span>
            <span className="ml-auto text-xs opacity-60">
              {hasChildren ? (expanded ? '▾' : '▸') : '·'}
            </span>
          </>
        ) : (
          <>
            <span className="mini-structure" aria-hidden="true">
              <span>{node.label.slice(0, 1)}</span>
            </span>
            <span className="structure-copy">
              <strong>{node.label}</strong>
              <span>{structure?.system ?? 'Model 3D'}</span>
              {structure && <DifficultyDots structure={structure} />}
              {structure && tab === 'study' && (
                <StudyProgressBar structure={structure} rememberedIds={rememberedIds} />
              )}
            </span>
            <span className="structure-badge">
              {structure
                ? getStructureBadge(structure, tab, rememberedIds, quizScore, isActive)
                : '–'}
            </span>
          </>
        )}
      </button>

      {hasChildren && expanded && (
        <div className={depth === 0 ? 'mt-2 grid gap-2' : undefined}>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              tab={tab}
              rememberedIds={rememberedIds}
              quizScore={quizScore}
              selectedStructureId={selectedStructureId}
              structures={structures}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PanelLeft() {
  const {
    structures,
    structuresLoading,
    loadStructures,
    activeLearningTab,
    rememberedAnnotationIds,
    quizScore,
    selectedStructure,
  } = useAppStore()

  useEffect(() => {
    loadStructures()
  }, [loadStructures])

  const tree = buildAnatomyTree(structures)
  const summary = getContextSummary(
    selectedStructure,
    activeLearningTab,
    rememberedAnnotationIds,
    quizScore,
  )

  return (
    <aside className="left-rail">
      <section className="atlas-panel">
        <div className="panel-heading">
          <span>✧ Układy Anatomiczne</span>
          <span aria-hidden="true">▾</span>
        </div>

        <nav className="grid gap-3">
          {structuresLoading ? (
            <div className="empty-state min-h-[180px]">
              <p>Ładowanie struktur...</p>
            </div>
          ) : (
            tree.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                tab={activeLearningTab}
                rememberedIds={rememberedAnnotationIds}
                quizScore={quizScore}
                selectedStructureId={selectedStructure?.id ?? null}
                structures={structures}
              />
            ))
          )}
        </nav>
      </section>

      <section className="atlas-panel">
        <div className="panel-heading">
          <span>◎ Praca z modelem</span>
        </div>
        <p className="context-summary">{summary}</p>
      </section>
    </aside>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/PanelLeft/PanelLeft.tsx
git commit -m "feat: dynamic left panel with learning mode badges and difficulty dots"
```

---

## Task 4: Verify in browser

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Open `http://localhost:3000`

- [ ] **Step 2: Check tree renders from API**

Confirm anatomy tree loads from API (not hardcoded). Panel should show a loading state then populate. If Supabase is unavailable, the tree will be empty — that is correct behavior (not a bug).

- [ ] **Step 3: Check `points` mode**

Default tab is `points`. Each organ card should show `"N pkt"` badge (e.g., `"12 pkt"`). Difficulty dots appear under the system name.

- [ ] **Step 4: Check `study` mode**

Click tab "Nauka" at the bottom panel. Each organ card should show `"0/N"` badge and a thin progress bar at 0%. Select an organ, mark a few annotations as remembered — return to panel and confirm count increases and bar fills.

- [ ] **Step 5: Check `quiz` mode**

Click tab "Quiz". Select an organ and answer some questions. The context summary at the bottom of the left panel should update to show `"Wynik quizu: X/N poprawnych · seria K ✓"`. Other organs show `"N pkt"`.

- [ ] **Step 6: Check context summary without selection**

Reload the page. Before selecting any structure, the bottom section should read "Wybierz strukturę z listy powyżej."

- [ ] **Step 7: Commit verification note**

```bash
git add -A
git commit -m "chore: verify left panel redesign in browser" --allow-empty
```

(Only run `git add -A` if there are unstaged changes from the dev run. If tree is empty, the `--allow-empty` flag allows a commit with no changes to mark completion.)
