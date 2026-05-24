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
