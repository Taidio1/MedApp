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
    <div
      style={{
        position: 'absolute',
        bottom: '48px',
        right: '16px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 12px',
        minWidth: '180px',
      }}
    >
      <p
        style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '8px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Warstwy
      </p>

      {layers.map((layer) => {
        const visible = isVisible(layer)
        return (
          <div
            key={layer.id}
            onClick={() => toggle(layer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 4px',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: visible ? 1 : 0.45,
              transition: 'opacity 0.15s',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={visible ? '#a78bfa' : 'rgba(255,255,255,0.4)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {visible ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>

            <span
              style={{
                fontSize: '12px',
                color: visible ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              }}
            >
              {layer.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
