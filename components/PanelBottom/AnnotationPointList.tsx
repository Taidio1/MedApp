'use client'

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
      <div className="empty-state min-h-[150px] rounded-md border border-dashed border-[#d1d5db]">
        Brak punktów dla wybranych warstw.
      </div>
    )
  }

  return (
    <div className="learning-card-grid">
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
              'learning-card group',
              isActive ? 'is-active' : '',
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
