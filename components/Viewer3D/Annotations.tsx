'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { Annotation } from '@/lib/types'

// Jeden punkt anotacji wybierający stabilny panel opisu
function AnnotationPoint({ annotation }: { annotation: Annotation }) {
  const { activeAnnotation, setActiveAnnotation, setSelectedStructure, structures } = useAppStore()
  const isActive = activeAnnotation?.id === annotation.id
  const baseSize = annotation.size ?? 0.08
  const pointRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const haloMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))

  useFrame(({ clock }, delta) => {
    const point = pointRef.current
    const halo = haloRef.current
    const haloMaterial = haloMaterialRef.current

    if (!point || !halo || !haloMaterial) return

    const targetPointScale = isActive ? 1.35 : 1
    targetScaleRef.current.set(targetPointScale, targetPointScale, targetPointScale)
    point.scale.lerp(targetScaleRef.current, Math.min(delta * 12, 1))

    if (isActive) {
      const pulse = (Math.sin(clock.getElapsedTime() * 5) + 1) / 2
      const haloScale = 1.2 + pulse * 0.45
      halo.scale.setScalar(haloScale)
      haloMaterial.opacity = 0.16 + pulse * 0.22
    } else {
      targetScaleRef.current.set(1, 1, 1)
      halo.scale.lerp(targetScaleRef.current, Math.min(delta * 10, 1))
      haloMaterial.opacity = 0.12
    }
  })

  const handleClick = () => {
    const structure = structures[annotation.structureId]
    if (structure) setSelectedStructure(structure)
    setActiveAnnotation(annotation)
  }

  return (
    <group position={annotation.position}>
      {/* Żółta kropka — klikalna */}
      <mesh
        ref={pointRef}
        renderOrder={20}
        onClick={handleClick}
        onPointerOver={() => setActiveAnnotation(annotation)}
      >
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial
          color={isActive ? '#f59e0b' : '#fbbf24'}
          depthTest={false}
        />
      </mesh>

      {/* Pulsująca obwódka */}
      <mesh ref={haloRef} renderOrder={19}>
        <sphereGeometry args={[baseSize * 1.5, 12, 12]} />
        <meshBasicMaterial
          ref={haloMaterialRef}
          color="#fbbf24"
          transparent
          opacity={0.12}
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
