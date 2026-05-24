'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Suspense, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { ModelLoader } from './ModelLoader'
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
    <>
      <div className="viewer-toolbar">
        <ToolbarBtn
          label="Obrót"
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
          label="Rozsuń"
          active={showExplodeSlider}
          disabled={!hasLayers}
          onClick={handleExplode}
        />
        <ToolbarBtn
          label="Wycinek"
          active={showClipSlider}
          disabled={!hasLayers}
          onClick={handleCrossSection}
        />
        <ToolbarBtn label="Reset" onClick={handleReset} />
      </div>

      {showExplodeSlider && (
        <SliderRow
          label="Rozsunięcie"
          min={0}
          max={1}
          step={0.01}
          value={explodeAmount}
          onChange={setExplodeAmount}
        />
      )}

      {showClipSlider && (
        <SliderRow
          label="Wycinek"
          min={-3}
          max={3}
          step={0.05}
          value={clippingPlaneY ?? 0}
          onChange={(v) => setClippingPlaneY(v)}
        />
      )}
    </>
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
      className={active ? 'is-active' : undefined}
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
    <div className="slider-popover">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

// ─── WASD ─────────────────────────────────────────────────────────────────────

function AnnotationDetailPanel() {
  const activeAnnotation = useAppStore((state) => state.activeAnnotation)
  const setActiveAnnotation = useAppStore((state) => state.setActiveAnnotation)

  if (!activeAnnotation) return null

  return (
    <aside className="annotation-detail-panel" aria-live="polite">
      <div className="annotation-detail-header">
        <span className="annotation-detail-label">Aktywny punkt</span>
        <button
          className="annotation-close-btn"
          onClick={() => setActiveAnnotation(null)}
          aria-label="Zamknij"
        >
          ✕
        </button>
      </div>
      <h2 className="annotation-detail-name">{activeAnnotation.label}</h2>
      {activeAnnotation.nameLAT && (
        <p className="annotation-detail-lat">{activeAnnotation.nameLAT}</p>
      )}
      {activeAnnotation.description && (
        <p className="annotation-detail-desc">{activeAnnotation.description}</p>
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

function ViewerWelcome() {
  const steps = [
    { num: '1', text: 'Rozwiń kategorię w lewym panelu' },
    { num: '2', text: 'Kliknij strukturę, by załadować model 3D' },
    { num: '3', text: 'Obracaj, powiększaj i eksploruj anatomię' },
  ]

  return (
    <div className="viewer-welcome">
      <div className="viewer-welcome-glow" aria-hidden="true" />
      <div className="viewer-welcome-icon" aria-hidden="true">✧</div>
      <h2 className="viewer-welcome-title">Atlas Anatomii 3D</h2>
      <p className="viewer-welcome-sub">
        Interaktywny atlas ciała ludzkiego w trójwymiarze
      </p>
      <div className="viewer-welcome-divider" aria-hidden="true" />
      <p className="viewer-welcome-hint">Jak zacząć?</p>
      <ol className="viewer-welcome-steps">
        {steps.map((s, i) => (
          <li key={i} className="viewer-welcome-step">
            <span className="viewer-welcome-step-num">{s.num}</span>
            <span className="viewer-welcome-step-text">{s.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Viewer3D() {
  const { selectedStructure, autoRotate, clippingPlaneY } = useAppStore()

  const modelUrl = selectedStructure
    ? `/models/${selectedStructure.id}.glb`
    : null

  const hasLayers = !!(selectedStructure?.layers?.length)

  if (!modelUrl) {
    return (
      <main className="stage-panel stage-panel--empty">
        <ViewerWelcome />
      </main>
    )
  }

  return (
    <main className="stage-panel">
      <div className="stage-title">
        <div>
          <h2>{selectedStructure?.namePL ?? 'Atlas 3D'}</h2>
          <p>{selectedStructure?.nameLAT ?? 'Wybierz strukturę z panelu po lewej'}</p>
        </div>

        <div className="view-card">
          <span className="view-card-title">View Mode</span>
          <div className="mode-switcher">
            <button type="button" className="mode-button is-active" title="Mesh">
              Mesh
            </button>
            <button
              type="button"
              className={clippingPlaneY !== null ? 'mode-button is-active' : 'mode-button'}
              title="Wycinek"
            >
              Focus
            </button>
          </div>
          <label className="toggle-line">
            <span>Cross Section</span>
            <input type="checkbox" checked={clippingPlaneY !== null} readOnly />
            <i className="toggle-track" />
          </label>
        </div>
      </div>

      <ViewerToolbar />

      {hasLayers && selectedStructure?.layers && (
        <LayerPanel layers={selectedStructure.layers} />
      )}

      <AnnotationDetailPanel />

      <div className="export-toolbar">
        <button type="button">Screenshot</button>
        <button type="button">GLB Export</button>
      </div>

      <div className="canvas-wrap">
        <div className="viewer3d-scene">
          <Canvas
            camera={{ position: [0, 1.2, 5.8], fov: 38 }}
            gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <color attach="background" args={['#fff9f2']} />
            <fog attach="fog" args={['#fff9f2', 9, 18]} />

            <ambientLight intensity={0.45} />
            <hemisphereLight args={['#fff8ea', '#e3ded2', 0.7]} />
            <directionalLight position={[3, 4, 4]} intensity={1.8} />
            <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#fff1df" />

            <Suspense fallback={null}>
              {hasLayers && selectedStructure?.layers ? (
                <LayeredModel
                  key={modelUrl}
                  url={modelUrl}
                  layers={selectedStructure.layers}
                />
              ) : (
                <ModelLoader key={modelUrl} url={modelUrl} />
              )}
              <ContactShadows
                position={[0, -1.55, 0]}
                opacity={0.24}
                scale={7.2}
                blur={2.6}
                far={4.2}
              />
            </Suspense>

            <Annotations />
            <WASDControls />
            <CameraResetWatcher />

            <OrbitControls
              makeDefault
              autoRotate={autoRotate}
              autoRotateSpeed={0.7}
              minDistance={3.2}
              maxDistance={8.4}
              enablePan
              panSpeed={0.5}
              enableDamping
              dampingFactor={0.08}
            />
          </Canvas>
        </div>
      </div>
    </main>
  )
}
