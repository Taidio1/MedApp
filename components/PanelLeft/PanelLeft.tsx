'use client'

import { useEffect, useState } from 'react'
import { AnatomyNode, AnatomicalStructure } from '@/lib/types'
import { buildAnatomyTree, MODEL_IDS } from '@/lib/anatomyData'
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
  const hasModel = !node.structureId || MODEL_IDS.has(node.structureId)

  const handleClick = () => {
    if (!hasModel) return
    if (hasChildren) setExpanded(prev => !prev)
    if (node.structureId && structures[node.structureId]) {
      setSelectedStructure(structures[node.structureId])
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={depth > 0 && !hasModel}
        className={[
          depth === 0 ? 'organelle-row' : 'structure-row',
          isActive ? 'is-active' : '',
          depth > 0 && !hasModel ? 'is-soon' : '',
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
            <span className={['structure-badge', !hasModel ? 'structure-badge--soon' : ''].join(' ')}>
              {!hasModel
                ? 'soon'
                : structure
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
