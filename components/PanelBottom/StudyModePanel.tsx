'use client'

import { useEffect } from 'react'
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
