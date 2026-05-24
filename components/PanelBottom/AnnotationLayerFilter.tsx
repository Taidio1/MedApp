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
