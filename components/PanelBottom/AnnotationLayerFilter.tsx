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
    <div className="filter-row">
      {annotationPointLayers.map((layerId) => {
        const active = activeLayers.includes(layerId)

        return (
          <button
            key={layerId}
            type="button"
            aria-pressed={active}
            onClick={() => onToggleLayer(layerId)}
            className={[
              'filter-pill',
              active ? 'is-active' : '',
            ].join(' ')}
          >
            {annotationPointLayerLabels[layerId]}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onEnableAll}
        className="filter-pill"
      >
        Wszystkie
      </button>
    </div>
  )
}
