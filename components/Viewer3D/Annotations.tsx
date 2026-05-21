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
              background: 'rgba(0,0,0,0.85)',
              color: 'white',
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(124,58,237,0.5)',
              pointerEvents: 'none',
            }}
          >
            {annotation.label}
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
