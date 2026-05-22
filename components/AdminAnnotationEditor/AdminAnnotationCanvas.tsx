'use client'

import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Component, ReactNode, Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Annotation } from '@/lib/types'

export type EditorMode = 'select' | 'add' | 'move' | 'preview'

interface AdminAnnotationCanvasProps {
  annotations: Annotation[]
  mode: EditorMode
  modelUrl: string | null
  selectedAnnotationId: string | null
  onAddAnnotation: (position: [number, number, number]) => void
  onMoveAnnotation: (id: string, position: [number, number, number]) => void
  onSelectAnnotation: (id: string) => void
  onMessage: (message: string) => void
}

class ModelLoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { hasError: boolean; resetKey: string }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode; resetKey: string }) {
    super(props)
    this.state = { hasError: false, resetKey: props.resetKey }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  static getDerivedStateFromProps(
    props: { resetKey: string },
    state: { resetKey: string },
  ) {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey }
    }

    return null
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function normalizeScene(scene: THREE.Group) {
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

  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.userData.isEditableModelMesh = true
    }
  })

  return model
}

function EditableModel({
  url,
  mode,
  onAddAnnotation,
  onMessage,
}: {
  url: string
  mode: EditorMode
  onAddAnnotation: (position: [number, number, number]) => void
  onMessage: (message: string) => void
}) {
  const { scene } = useGLTF(url)
  const normalizedScene = useMemo(() => normalizeScene(scene), [scene])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'add') return

    event.stopPropagation()
    const point = event.point
    onAddAnnotation([
      Number(point.x.toFixed(3)),
      Number(point.y.toFixed(3)),
      Number(point.z.toFixed(3)),
    ])
  }

  return <primitive object={normalizedScene} onClick={handleClick} />
}

function ModelFallback({
  mode,
  onAddAnnotation,
}: {
  mode: EditorMode
  onAddAnnotation: (position: [number, number, number]) => void
}) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'add') return

    event.stopPropagation()
    const point = event.point
    onAddAnnotation([
      Number(point.x.toFixed(3)),
      Number(point.y.toFixed(3)),
      Number(point.z.toFixed(3)),
    ])
  }

  return (
    <mesh onClick={handleClick}>
      <sphereGeometry args={[1.45, 48, 48]} />
      <meshStandardMaterial
        color="#334155"
        wireframe
        opacity={0.55}
        transparent
      />
    </mesh>
  )
}

function EditablePoint({
  annotation,
  mode,
  selected,
  onSelectAnnotation,
  onMoveAnnotation,
}: {
  annotation: Annotation
  mode: EditorMode
  selected: boolean
  onSelectAnnotation: (id: string) => void
  onMoveAnnotation: (id: string, position: [number, number, number]) => void
}) {
  const dragging = useRef(false)
  const baseSize = annotation.size ?? 0.08

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelectAnnotation(annotation.id)
    dragging.current = mode === 'move'
    if (dragging.current && event.target instanceof Element) {
      event.target.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || mode !== 'move') return
    event.stopPropagation()

    const hit = event.intersections.find(
      (intersection) => intersection.object.userData.isEditableModelMesh,
    )
    const point = hit?.point ?? event.point

    onMoveAnnotation(annotation.id, [
      Number(point.x.toFixed(3)),
      Number(point.y.toFixed(3)),
      Number(point.z.toFixed(3)),
    ])
  }

  const stopDragging = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    event.stopPropagation()
    dragging.current = false
    if (event.target instanceof Element) {
      event.target.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <group position={annotation.position}>
      <mesh
        renderOrder={30}
        onClick={(event) => {
          event.stopPropagation()
          onSelectAnnotation(annotation.id)
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <sphereGeometry args={[selected ? baseSize * 1.45 : baseSize, 18, 18]} />
        <meshBasicMaterial
          color={selected ? '#f59e0b' : annotation.visible === false ? '#64748b' : '#fbbf24'}
          depthTest={false}
        />
      </mesh>
      {selected && (
        <mesh renderOrder={29}>
          <sphereGeometry args={[baseSize * 1.85, 18, 18]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.22}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  )
}

export function AdminAnnotationCanvas({
  annotations,
  mode,
  modelUrl,
  selectedAnnotationId,
  onAddAnnotation,
  onMoveAnnotation,
  onSelectAnnotation,
  onMessage,
}: AdminAnnotationCanvasProps) {
  return (
    <div className="relative h-full overflow-hidden bg-[#101827]">
      <div className="absolute left-4 top-4 z-10 rounded-md border border-[#334155] bg-[#0f172a]/90 px-3 py-2 text-[11px] text-slate-300 shadow-lg">
        {mode === 'add' && 'Kliknij powierzchnię modelu, aby dodać punkt.'}
        {mode === 'move' && 'Przeciągnij zaznaczony punkt po modelu.'}
        {mode === 'select' && 'Wybierz punkt do edycji.'}
        {mode === 'preview' && 'Podgląd punktów jak w aplikacji.'}
      </div>

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => {
          if (mode === 'add') onMessage('Kliknij bezpośrednio w model, aby dodać punkt.')
        }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 10, 5]} intensity={1.1} />
        <directionalLight position={[-4, -4, -4]} intensity={0.25} />

        <ModelLoadBoundary
          resetKey={modelUrl ?? 'placeholder'}
          fallback={<ModelFallback mode={mode} onAddAnnotation={onAddAnnotation} />}
        >
          <Suspense fallback={<ModelFallback mode={mode} onAddAnnotation={onAddAnnotation} />}>
            {modelUrl ? (
              <EditableModel
                url={modelUrl}
                mode={mode}
                onAddAnnotation={onAddAnnotation}
                onMessage={onMessage}
              />
            ) : (
              <ModelFallback mode={mode} onAddAnnotation={onAddAnnotation} />
            )}
          </Suspense>
        </ModelLoadBoundary>

        {annotations.map((annotation) => (
          <EditablePoint
            key={annotation.id}
            annotation={annotation}
            mode={mode}
            selected={annotation.id === selectedAnnotationId}
            onSelectAnnotation={onSelectAnnotation}
            onMoveAnnotation={onMoveAnnotation}
          />
        ))}

        <OrbitControls
          makeDefault
          minDistance={1}
          maxDistance={20}
          enablePan
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}
