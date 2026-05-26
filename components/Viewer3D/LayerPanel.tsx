'use client'

import { useAppStore } from '@/lib/store'
import { AnatomyLayer } from '@/lib/types'

interface LayerPanelProps {
  layers: AnatomyLayer[]
}

/**
 * Floating panel w prawym dolnym rogu viewera 3D.
 * Wyświetla listę warstw z togglem widoczności (ikona oka).
 * Pojawia się tylko gdy aktywna struktura ma zdefiniowane warstwy.
 */
export function LayerPanel({ layers }: LayerPanelProps) {
  const { layerVisibility, setLayerVisibility } = useAppStore()

  const isVisible = (layer: AnatomyLayer) =>
    layerVisibility[layer.id] ?? layer.defaultVisible

  const toggle = (layer: AnatomyLayer) => {
    setLayerVisibility(layer.id, !isVisible(layer))
  }

  return (
    <div className="layer-panel">
      <p className="section-label mb-2">Warstwy</p>

      {layers.map((layer) => {
        const visible = isVisible(layer)
        return (
          <button
            key={layer.id}
            onClick={() => toggle(layer)}
            className="layer-row"
            style={{ opacity: visible ? 1 : 0.45 }}
          >
            <span className="color-dot" />
            <span className="truncate text-sm">{layer.label}</span>
            <span className="ml-auto text-xs opacity-60">{visible ? '●' : '○'}</span>
          </button>
        )
      })}
    </div>
  )
}
