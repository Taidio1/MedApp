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

function CameraResetWatcher() {
  const { camera } = useThree()
  const trigger = useAppStore((s) => s.cameraResetTrigger)
  const previousTrigger = useRef(0)

  useEffect(() => {
    if (trigger > 0 && trigger !== previousTrigger.current) {
      previousTrigger.current = trigger
      camera.position.set(0, 0, 5)
      camera.lookAt(0, 0, 0)
    }
  }, [trigger, camera])

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
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#1a1a2e' }}>
      <ViewerToolbar />

      {hasLayers && selectedStructure?.layers && (
        <LayerPanel layers={selectedStructure.layers} />
      )}

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
          <p style={{ color: '#3a3a6a', fontSize: '11px' }}>
            Wgraj model{' '}
            <code style={{ background: '#2a2a4e', padding: '0 4px', borderRadius: '3px' }}>
              .glb
            </code>{' '}
            do{' '}
            <code style={{ background: '#2a2a4e', padding: '0 4px', borderRadius: '3px' }}>
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
          background: 'linear-gradient(to top, #1a1a2e, transparent)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.2} />

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
