'use client'

import { useGLTF } from '@react-three/drei'
import { Component, ReactNode } from 'react'

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
  return <primitive object={scene} />
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
