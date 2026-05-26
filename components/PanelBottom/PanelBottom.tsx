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
    <div className="empty-state">
      <h2>Mapa nauki</h2>
      <p>Po wybraniu narządu pojawią się tutaj punkty orientacyjne, tryb nauki i quiz.</p>
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
    <section className="bottom-grid" id="learning">
      <div className="learning-map-panel">
        {!selectedStructure ? (
          <EmptyLearningPanel />
        ) : (
          <>
            <div className="panel-heading">
              <span>Mapa nauki</span>
              <span>
                {filteredAnnotations.length}/{annotations.length} punkty
              </span>
            </div>

            <div className="learning-header">
              <div className="min-w-0">
                <h3 className="m-0 font-serif text-2xl leading-none text-[#28231c]">
                  {selectedStructure.namePL}
                </h3>
                <p className="mt-1 truncate font-serif text-sm italic text-[#776d61]">
                  {selectedStructure.nameLAT}
                </p>
              </div>
              <div className="min-w-0">
                <LearningTabs
                  activeTab={activeLearningTab}
                  onChange={setActiveLearningTab}
                />
              </div>
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
          </>
        )}
      </div>

      <div className="compare-panel" id="layers">
        <div className="panel-heading">
          <span>Filtry mapy nauki</span>
          <span aria-hidden="true">◑</span>
        </div>
        {selectedStructure ? (
          <AnnotationLayerFilter
            activeLayers={activeAnnotationPointLayers}
            onToggleLayer={toggleAnnotationPointLayer}
            onEnableAll={enableAllAnnotationPointLayers}
          />
        ) : (
          <div className="empty-state">
            <p>Wybierz strukturę, aby filtrować punkty nauki.</p>
          </div>
        )}
      </div>
    </section>
  )
}
