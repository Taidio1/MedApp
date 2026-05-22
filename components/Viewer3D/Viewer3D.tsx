'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { ModelLoader, PlaceholderMesh } from './ModelLoader'
import { LayeredModel } from './LayeredModel'
import { LayerPanel } from './LayerPanel'
import { Annotations } from './Annotations'
import { useAppStore } from '@/lib/store'

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ViewerToolbar() {
  const {
    autoRotate, setAutoRotate,
    triggerCameraReset,
    explodeAmount, setExplodeAmount,
    clippingPlaneY, setClippingPlaneY,
    splitOpen, setSplitOpen,
    resetLayerVisibility,
    selectedStructure,
  } = useAppStore()

  const hasLayers = !!selectedStructure?.layers?.length
  const [showExplodeSlider, setShowExplodeSlider] = useState(false)
  const [showClipSlider, setShowClipSlider] = useState(false)

  const handleReset = () => {
    triggerCameraReset()
    setExplodeAmount(0)
    setClippingPlaneY(null)
    setSplitOpen(false)
    resetLayerVisibility()
    setShowExplodeSlider(false)
    setShowClipSlider(false)
  }

  const handleSplit = () => {
    if (!hasLayers) return
    setSplitOpen(!splitOpen)
  }

  const handleExplode = () => {
    if (!hasLayers) return
    const next = !showExplodeSlider
    setShowExplodeSlider(next)
    if (!next) setExplodeAmount(0)
  }

  const handleCrossSection = () => {
    if (!hasLayers) return
    const next = !showClipSlider
    setShowClipSlider(next)
    if (next) setClippingPlaneY(0)
    else setClippingPlaneY(null)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '999px',
          padding: '6px 12px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <ToolbarBtn
          label="Rotate"
          active={autoRotate}
          onClick={() => setAutoRotate(!autoRotate)}
        />
        <ToolbarBtn
          label="Split"
          active={splitOpen}
          disabled={!hasLayers}
          onClick={handleSplit}
        />
        <ToolbarBtn
          label="Explode"
          active={showExplodeSlider}
          disabled={!hasLayers}
          onClick={handleExplode}
        />
        <ToolbarBtn
          label="Cross-Section"
          active={showClipSlider}
          disabled={!hasLayers}
          onClick={handleCrossSection}
        />
        <ToolbarBtn label="Reset View" onClick={handleReset} />
      </div>

      {showExplodeSlider && (
        <SliderRow
          label="Explode"
          min={0}
          max={1}
          step={0.01}
          value={explodeAmount}
          onChange={setExplodeAmount}
        />
      )}

      {showClipSlider && (
        <SliderRow
          label="Cross-Section"
          min={-3}
          max={3}
          step={0.05}
          value={clippingPlaneY ?? 0}
          onChange={(v) => setClippingPlaneY(v)}
        />
      )}
    </div>
  )
}

function ToolbarBtn({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 12px',
        fontSize: '11px',
        borderRadius: '999px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        background: active ? '#7c3aed' : 'transparent',
        color: disabled
          ? 'rgba(255,255,255,0.25)'
          : active
          ? 'white'
          : 'rgba(255,255,255,0.7)',
      }}
    >
      {label}
    </button>
  )
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        borderRadius: '999px',
        padding: '5px 14px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '120px', accentColor: '#7c3aed' }}
      />
    </div>
  )
}

// ─── WASD ─────────────────────────────────────────────────────────────────────

function AnnotationDetailPanel() {
  const activeAnnotation = useAppStore((state) => state.activeAnnotation)

  if (!activeAnnotation) return null

  return (
    <aside
      className="absolute right-4 top-[86px] z-10 w-[260px] rounded-lg border border-[#7c3aed]/50 bg-[#f8f5ef] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      aria-live="polite"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7c3aed]">
        Aktywny punkt
      </p>
      <h2 className="mt-2 text-base font-bold leading-tight text-[#111827]">
        {activeAnnotation.label}
      </h2>
      {activeAnnotation.nameLAT && (
        <p className="mt-1 text-xs italic text-[#6d28d9]">
          {activeAnnotation.nameLAT}
        </p>
      )}
      {activeAnnotation.description && (
        <p className="mt-3 text-xs leading-relaxed text-[#4b5563]">
          {activeAnnotation.description}
        </p>
      )}
    </aside>
  )
}

function WASDControls() {
  const { camera } = useThree()
  const keys = useRef(new Set<string>())

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) =>
      keys.current.add(e.key.toLowerCase())
    const onKeyUp = (e: KeyboardEvent) =>
      keys.current.delete(e.key.toLowerCase())

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame(() => {
    const speed = 0.04
    const right = new THREE.Vector3()
    const forward = new THREE.Vector3()

    camera.getWorldDirection(forward)
    right.crossVectors(forward, camera.up).normalize()

    if (keys.current.has('w')) camera.position.addScaledVector(forward, speed)
    if (keys.current.has('s')) camera.position.addScaledVector(forward, -speed)
    if (keys.current.has('a')) camera.position.addScaledVector(right, -speed)
    if (keys.current.has('d')) camera.position.addScaledVector(right, speed)
  })

  return null
}

// ─── Camera Reset ─────────────────────────────────────────────────────────────

function getCameraPosition(aspect: number): [number, number, number] {
  return aspect < 0.8 ? [0, 1.2, 7.2] : [0, 1.2, 5]
}

function CameraResetWatcher() {
  const { camera } = useThree()
  const { width, height } = useThree((state) => state.size)
  const trigger = useAppStore((s) => s.cameraResetTrigger)
  const previousTrigger = useRef(0)
  const previousAspectMode = useRef<string | null>(null)

  useEffect(() => {
    const aspect = height > 0 ? width / height : 1
    const aspectMode = aspect < 0.8 ? 'narrow' : 'wide'

    if (
      previousAspectMode.current !== aspectMode ||
      (trigger > 0 && trigger !== previousTrigger.current)
    ) {
      previousTrigger.current = trigger
      previousAspectMode.current = aspectMode
      camera.position.set(...getCameraPosition(aspect))
      camera.lookAt(0, 0, 0)
    }
  }, [trigger, camera, width, height])

  return null
}

// ─── Main Viewer ──────────────────────────────────────────────────────────────

export function Viewer3D() {
  const { selectedStructure, autoRotate } = useAppStore()

  const modelUrl = selectedStructure
    ? `/models/${selectedStructure.id}.glb`
    : null

  const hasLayers = !!(selectedStructure?.layers?.length)

  return (
    <div
      className="viewer3d-scene"
      style={{ position: 'relative', width: '100%', height: '100%', background: '#f4f1ea' }}
    >
      <ViewerToolbar />

      {hasLayers && selectedStructure?.layers && (
        <LayerPanel layers={selectedStructure.layers} />
      )}

      <AnnotationDetailPanel />

      {!modelUrl && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <p style={{ color: '#6b5f78', fontSize: '11px' }}>
            Wgraj model{' '}
            <code style={{ background: '#e7e0d6', padding: '0 4px', borderRadius: '3px' }}>
              .glb
            </code>{' '}
            do{' '}
            <code style={{ background: '#e7e0d6', padding: '0 4px', borderRadius: '3px' }}>
              /public/models/
            </code>
          </p>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'linear-gradient(to top, rgba(244,241,234,0.95), transparent)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <Canvas
        camera={{ position: [0, 1.2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#f4f1ea']} />
        <fog attach="fog" args={['#f4f1ea', 8, 16]} />

        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 10, 5]} intensity={1.1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.35} />

        <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial color="#eee8dc" roughness={1} />
        </mesh>
        <gridHelper
          args={[16, 8, '#6b7280', '#b8b2a8']}
          position={[0, -1.34, 0]}
        />

        <Suspense fallback={null}>
          {modelUrl && hasLayers && selectedStructure?.layers ? (
            <LayeredModel
              key={modelUrl}
              url={modelUrl}
              layers={selectedStructure.layers}
            />
          ) : modelUrl ? (
            <ModelLoader key={modelUrl} url={modelUrl} />
          ) : (
            <PlaceholderMesh />
          )}
        </Suspense>

        <Annotations />
        <WASDControls />
        <CameraResetWatcher />

        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={1}
          maxDistance={20}
          enablePan
          panSpeed={0.5}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}
