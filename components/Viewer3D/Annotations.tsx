'use client'

import { useState } from 'react'
import { Html } from '@react-three/drei'
import { useAppStore } from '@/lib/store'
import { structures } from '@/lib/anatomyData'
import { Annotation } from '@/lib/types'

// Jeden punkt anotacji z tooltipem przy hover
function AnnotationPoint({ annotation }: { annotation: Annotation }) {
  const [hovered, setHovered] = useState(false)
  const { setSelectedStructure } = useAppStore()

  const handleClick = () => {
    const structure = structures[annotation.structureId]
    if (structure) setSelectedStructure(structure)
  }

  return (
    <group position={annotation.position}>
      {/* Żółta kropka — klikalna */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hovered ? 0.1 : 0.08, 12, 12]} />
        <meshBasicMaterial color={hovered ? '#f59e0b' : '#fbbf24'} />
      </mesh>

      {/* Pulsująca obwódka */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} />
      </mesh>

      {/* Tooltip HTML przy hover */}
      {hovered && (
        <Html distanceFactor={10} zIndexRange={[100, 0]}>
          <div
            style={{
              background: '#1e1b4b',
              border: '1px solid #7c3aed',
              borderRadius: '10px',
              padding: '10px 14px',
              maxWidth: '220px',
              whiteSpace: 'normal',
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              position: 'relative',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Nazwa PL */}
            <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px' }}>
              {annotation.label}
            </div>

            {/* Nazwa łacińska */}
            {annotation.nameLAT && (
              <div style={{ fontStyle: 'italic', color: '#818cf8', fontSize: '10px', marginTop: '2px' }}>
                {annotation.nameLAT}
              </div>
            )}

            {/* Separator */}
            {(annotation.nameLAT && annotation.description) && (
              <hr style={{ border: 'none', borderTop: '1px solid #2d1b69', margin: '6px 0' }} />
            )}

            {/* Opis */}
            {annotation.description && (
              <div style={{ color: '#c4b5fd', fontSize: '11px', lineHeight: '1.5' }}>
                {annotation.description}
              </div>
            )}

            {/* Strzałka wskazująca na punkt */}
            {/* Outer arrow (border color) */}
            <div
              style={{
                position: 'absolute',
                bottom: '-7px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '7px solid #7c3aed',
              }}
            />
            {/* Inner arrow (background color, masks border seam) */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '6px solid #1e1b4b',
              }}
            />
          </div>
        </Html>
      )}
    </group>
  )
}

/** Renderuje wszystkie anotacje dla aktualnie wybranej struktury */
export function Annotations() {
  const { selectedStructure } = useAppStore()

  if (!selectedStructure || selectedStructure.annotations.length === 0) {
    return null
  }

  return (
    <>
      {selectedStructure.annotations.map((annotation) => (
        <AnnotationPoint key={annotation.id} annotation={annotation} />
      ))}
    </>
  )
}
