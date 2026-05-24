'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { filterAnnotationsByLayers } from '@/lib/learning'
import { AnnotationLayerFilter } from './AnnotationLayerFilter'
import { LearningTabs } from './LearningTabs'
import { AnnotationPointList } from './AnnotationPointList'
import { StudyModePanel } from './StudyModePanel'
import { QuizModePanel } from './QuizModePanel'

function EmptyLearningPanel() {
  return (
    <div className="flex h-full flex-1 items-center justify-center px-6 text-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Mapa nauki
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#6b7280]">
          Po wybraniu narządu pojawią się tutaj punkty orientacyjne, tryb nauki i quiz.
        </p>
      </div>
    </div>
  )
}

function LearningMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="min-w-[92px] rounded-md border border-[#e5e7eb] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-[#111827]">
        {value}
      </div>
    </div>
  )
}

export function PanelBottom() {
  const selectedStructure = useAppStore((state) => state.selectedStructure)
  const structures = useAppStore((state) => state.structures)
  const activeAnnotation = useAppStore((state) => state.activeAnnotation)
  const setActiveAnnotation = useAppStore((state) => state.setActiveAnnotation)
  const activeLearningTab = useAppStore((state) => state.activeLearningTab)
  const setActiveLearningTab = useAppStore((state) => state.setActiveLearningTab)
  const activeAnnotationPointLayers = useAppStore(
    (state) => state.activeAnnotationPointLayers,
  )
  const toggleAnnotationPointLayer = useAppStore(
    (state) => state.toggleAnnotationPointLayer,
  )
  const enableAllAnnotationPointLayers = useAppStore(
    (state) => state.enableAllAnnotationPointLayers,
  )
  const studyIndex = useAppStore((state) => state.studyIndex)
  const setStudyIndex = useAppStore((state) => state.setStudyIndex)
  const rememberedAnnotationIds = useAppStore(
    (state) => state.rememberedAnnotationIds,
  )
  const toggleRememberedAnnotation = useAppStore(
    (state) => state.toggleRememberedAnnotation,
  )
  const quizQuestion = useAppStore((state) => state.quizQuestion)
  const setQuizQuestion = useAppStore((state) => state.setQuizQuestion)
  const selectedQuizAnswerId = useAppStore((state) => state.selectedQuizAnswerId)
  const setSelectedQuizAnswerId = useAppStore(
    (state) => state.setSelectedQuizAnswerId,
  )
  const quizScore = useAppStore((state) => state.quizScore)
  const setQuizScore = useAppStore((state) => state.setQuizScore)

  const annotations = useMemo(
    () => selectedStructure?.annotations ?? [],
    [selectedStructure?.annotations],
  )
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
  const activeAnnotationInStructure =
    activeAnnotation?.structureId === selectedStructure?.id ? activeAnnotation : null

  return (
    <section className="flex h-[120px] flex-shrink-0 items-stretch overflow-hidden border-t border-[#e5e7eb] bg-[#f5f0e8]">
      {!selectedStructure ? (
        <EmptyLearningPanel />
      ) : (
        <>
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
                <LearningTabs
                  activeTab={activeLearningTab}
                  onChange={setActiveLearningTab}
                />
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

          <div className="flex w-[300px] flex-shrink-0 flex-col gap-2 border-l border-[#e5e7eb] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Szybka powtórka
            </p>
            <div className="grid grid-cols-2 gap-2">
              <LearningMetric label="Układ" value={selectedStructure.system} />
              <LearningMetric label="Tryb" value={activeLearningTab} />
            </div>
            <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6b7280]">
              {activeAnnotationInStructure?.description ??
                filteredAnnotations[0]?.description ??
                selectedStructure.description}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
