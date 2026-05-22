'use client'

import { useGLTF } from '@react-three/drei'
import { Component, ReactNode, useMemo } from 'react'
import * as THREE from 'three'

// ErrorBoundary do obsługi braku pliku .glb
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

// Placeholder wyświetlany gdy brak modelu .glb — eksportowany dla Viewer3D
export function PlaceholderMesh() {
  return (
    <group>
      {/* Zewnętrzna sfera — wireframe fioletowy */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          wireframe
          opacity={0.5}
          transparent
        />
      </mesh>
      {/* Wewnętrzna sfera — wireframe jaśniejszy */}
      <mesh>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial
          color="#9d4edd"
          wireframe
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  )
}

// Komponent ładujący model .glb
function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const normalizedScene = useMemo(() => {
    const model = scene.clone(true)
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()

    box.getSize(size)
    box.getCenter(center)

    const maxDimension = Math.max(size.x, size.y, size.z)
    if (Number.isFinite(maxDimension) && maxDimension > 0) {
      const scale = 2.8 / maxDimension
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    }

    return model
  }, [scene])

  return <primitive object={normalizedScene} />
}

interface ModelLoaderProps {
  /** Ścieżka do pliku .glb względem /public */
  url: string
}

/** Ładuje model .glb z automatycznym fallbackiem na placeholder */
export function ModelLoader({ url }: ModelLoaderProps) {
  return (
    <ModelErrorBoundary fallback={<PlaceholderMesh />}>
      <GLBModel url={url} />
    </ModelErrorBoundary>
  )
}
