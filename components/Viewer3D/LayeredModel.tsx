'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { AnatomyLayer } from '@/lib/types'

/**
 * Oblicza docelową pozycję meshu na podstawie stanu warstw.
 */
export function getLayerTargetPosition(
  layer: AnatomyLayer,
  explodeAmount: number,
  splitOpen: boolean,
): THREE.Vector3 {
  const base = layer.basePosition
    ? new THREE.Vector3(...layer.basePosition)
    : new THREE.Vector3(0, 0, 0)

  // Split: rozsunięcie połówek czaszki
  if (layer.isPair && splitOpen && layer.splitAxis && layer.splitDistance != null) {
    const direction = layer.splitDirection ?? 1
    base[layer.splitAxis] += layer.splitDistance * direction
  }

  // Explode: odsunięcie wzdłuż wektora explodeOffset
  if (explodeAmount > 0 && layer.explodeOffset) {
    const offset = new THREE.Vector3(...layer.explodeOffset)
    base.addScaledVector(offset, explodeAmount)
  }

  return base
}

interface LayeredModelProps {
  url: string
  layers: AnatomyLayer[]
}

/**
 * Ładuje multi-mesh GLB i animuje warstwy na podstawie stanu store.
 * Każdy mesh jest animowany przez lerp w useFrame (frame-rate independent).
 */
export function LayeredModel({ url, layers: layerConfig }: LayeredModelProps) {
  const { scene } = useGLTF(url)
  const { layerVisibility, explodeAmount, splitOpen, clippingPlaneY } = useAppStore()

  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const clippingPlane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0))

  useEffect(() => {
    meshRefs.current.clear()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        meshRefs.current.set(obj.name, obj)
      }
    })
  }, [scene])

  useFrame((_, delta) => {
    // Frame-rate independent lerp — reaches ~99% of target in ~0.5s
    const t = 1 - Math.pow(0.001, delta)

    meshRefs.current.forEach((mesh, name) => {
      const config = layerConfig.find((l) => l.id === name)
      if (!config) return

      const visible = layerVisibility[name] ?? config.defaultVisible
      mesh.visible = visible

      if (!visible) return

      const target = getLayerTargetPosition(config, explodeAmount, splitOpen)
      mesh.position.lerp(target, t)

      const mat = Array.isArray(mesh.material)
        ? mesh.material[0] as THREE.MeshStandardMaterial
        : mesh.material as THREE.MeshStandardMaterial

      if (clippingPlaneY !== null) {
        clippingPlane.current.constant = clippingPlaneY
        mat.clippingPlanes = [clippingPlane.current]
      } else {
        mat.clippingPlanes = []
      }
      mat.needsUpdate = true
    })
  })

  return <primitive object={scene} />
}
