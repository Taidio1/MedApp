'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { Annotation } from '@/lib/types'
import { filterAnnotationsByLayers } from '@/lib/learning'

const LAYER_COLORS: Record<string, string> = {
  organ:      '#e05252',
  vessels:    '#4a7fc1',
  nerves:     '#d4a017',
  clinical:   '#d07a30',
  topography: '#4a9e6b',
}

const ACTIVE_LAYER_COLORS: Record<string, string> = {
  organ:      '#ea7878',
  vessels:    '#7da7d9',
  nerves:     '#ddbf56',
  clinical:   '#de9e62',
  topography: '#74bc8f',
}

const FALLBACK_COLOR = '#fbbf24'
const FALLBACK_ACTIVE_COLOR = '#f59e0b'

function getAnnotationColor(annotation: Annotation, active: boolean): string {
  const firstLayer = annotation.layerIds?.[0]
  if (!firstLayer) return active ? FALLBACK_ACTIVE_COLOR : FALLBACK_COLOR
  return active
    ? (ACTIVE_LAYER_COLORS[firstLayer] ?? FALLBACK_ACTIVE_COLOR)
    : (LAYER_COLORS[firstLayer] ?? FALLBACK_COLOR)
}

function AnnotationPoint({ annotation }: { annotation: Annotation }) {
  const { activeAnnotation, setActiveAnnotation, setSelectedStructure, structures } = useAppStore()
  const isActive = activeAnnotation?.id === annotation.id
  const [isHovered, setIsHovered] = useState(false)
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

    const targetPointScale = isActive ? 1.35 : isHovered ? 1.15 : 1
    targetScaleRef.current.set(targetPointScale, targetPointScale, targetPointScale)
    point.scale.lerp(targetScaleRef.current, Math.min(delta * 12, 1))

    if (isActive) {
      const pulse = (Math.sin(clock.getElapsedTime() * 5) + 1) / 2
      halo.scale.setScalar(1.2 + pulse * 0.45)
      haloMaterial.opacity = 0.16 + pulse * 0.22
    } else {
      targetScaleRef.current.set(1, 1, 1)
      halo.scale.lerp(targetScaleRef.current, Math.min(delta * 10, 1))
      haloMaterial.opacity = isHovered ? 0.2 : 0.12
    }
  })

  const handleClick = () => {
    const structure = structures[annotation.structureId]
    if (structure) setSelectedStructure(structure)
    setActiveAnnotation(annotation)
  }

  const dotColor = getAnnotationColor(annotation, isActive)
  const firstLayer = annotation.layerIds?.[0]
  const haloColor = firstLayer ? (LAYER_COLORS[firstLayer] ?? FALLBACK_COLOR) : FALLBACK_COLOR

  return (
    <group position={annotation.position}>
      <mesh
        ref={pointRef}
        renderOrder={20}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <sphereGeometry args={[baseSize, 12, 12]} />
        <meshBasicMaterial color={dotColor} depthTest={false} />
      </mesh>

      <mesh ref={haloRef} renderOrder={19}>
        <sphereGeometry args={[baseSize * 1.5, 12, 12]} />
        <meshBasicMaterial
          ref={haloMaterialRef}
          color={haloColor}
          transparent
          opacity={0.12}
          depthTest={false}
        />
      </mesh>
    </group>
  )
}

export function Annotations() {
  const { selectedStructure, activeAnnotationPointLayers } = useAppStore()

  if (!selectedStructure || selectedStructure.annotations.length === 0) {
    return null
  }

  return (
    <>
      {filterAnnotationsByLayers(
        selectedStructure.annotations,
        activeAnnotationPointLayers,
      ).map((annotation) => (
        <AnnotationPoint key={annotation.id} annotation={annotation} />
      ))}
    </>
  )
}
