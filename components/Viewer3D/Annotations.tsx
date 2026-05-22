'use client'

import { useAppStore } from '@/lib/store'
import { structures } from '@/lib/anatomyData'
import { Annotation } from '@/lib/types'

// Jeden punkt anotacji wybierający stabilny panel opisu
function AnnotationPoint({ annotation }: { annotation: Annotation }) {
  const { activeAnnotation, setActiveAnnotation, setSelectedStructure } = useAppStore()
  const isActive = activeAnnotation?.id === annotation.id
  const baseSize = annotation.size ?? 0.08

  const handleClick = () => {
    const structure = structures[annotation.structureId]
    if (structure) setSelectedStructure(structure)
    setActiveAnnotation(annotation)
  }

  return (
    <group position={annotation.position}>
      {/* Żółta kropka — klikalna */}
      <mesh
        renderOrder={20}
        onClick={handleClick}
        onPointerOver={() => setActiveAnnotation(annotation)}
      >
        <sphereGeometry args={[isActive ? baseSize * 1.35 : baseSize, 12, 12]} />
        <meshBasicMaterial
          color={isActive ? '#f59e0b' : '#fbbf24'}
          depthTest={false}
        />
      </mesh>

      {/* Pulsująca obwódka */}
      <mesh renderOrder={19}>
        <sphereGeometry args={[baseSize * 1.5, 12, 12]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.2}
          depthTest={false}
        />
      </mesh>
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
      {selectedStructure.annotations
        .filter((annotation) => annotation.visible !== false)
        .map((annotation) => (
          <AnnotationPoint key={annotation.id} annotation={annotation} />
        ))}
    </>
  )
}
