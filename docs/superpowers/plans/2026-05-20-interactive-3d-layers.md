# Interactive 3D Anatomy Layers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add layered anatomy dissection to Anatomy Studio — animated skull split, brain extraction, explode view, and free cross-section clipping plane.

**Architecture:** Single multi-mesh GLB (`glowa.glb`) with named meshes (`skull_left`, `skull_right`, `brain`, `brainstem`). A new `LayeredModel` component uses `useFrame` lerp for smooth ~0.5s animations. Zustand store tracks per-layer visibility, explode amount (0–1), split state, and clipping plane Y. A floating `LayerPanel` overlays the 3D viewport with per-layer eye-icon toggles.

**Tech Stack:** Three.js 0.184, React Three Fiber v9, Zustand v5, TypeScript 5, Next.js 16 App Router (no new dependencies needed).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/types.ts` | Add `AnatomyLayer` interface; add `layers?` to `AnatomicalStructure` |
| Modify | `lib/store.ts` | Add `layerVisibility`, `explodeAmount`, `clippingPlaneY`, `splitOpen` |
| Modify | `lib/anatomyData.ts` | Add `glowa` structure + layer config; add node to anatomy tree |
| Create | `components/Viewer3D/LayeredModel.tsx` | Multi-mesh GLB renderer with lerp animation + clipping |
| Create | `components/Viewer3D/LayerPanel.tsx` | Floating per-layer visibility panel |
| Modify | `components/Viewer3D/Viewer3D.tsx` | Updated toolbar (Split/Explode/CrossSection + sliders), `localClippingEnabled`, LayerPanel integration |

---

## Task 1: Obtain and prepare the GLB model

**Files:**
- Create: `public/models/glowa.glb`

- [ ] **Step 1.1: Download a skull+brain model**

  Option A (recommended) — NIH 3D Print Exchange (Public Domain):
  - Go to `https://3dprint.nih.gov/`
  - Search: `skull brain`
  - Download any `.stl` or `.glb` with a skull AND separate brain mesh
  - Good candidate: "Skull with Brain" or "Human Head Anatomy"

  Option B — Sketchfab (CC Attribution):
  - Go to `https://sketchfab.com/search?q=skull+brain+anatomy&licenses=7c23a1ba4a534d58b09e7b69e78e167f`
    (license filter = CC Attribution)
  - Filter: Downloadable = Yes
  - Search: `skull brain removable anatomy`
  - Download as `.glb` or `.fbx` (convert to `.glb` in Blender if needed)

  Place final file at: `public/models/glowa.glb`

- [ ] **Step 1.2: Inspect mesh names**

  Open `glowa.glb` in the online viewer at `https://gltf.report/` or install:
  ```bash
  npx gltf-transform inspect public/models/glowa.glb
  ```
  Note down the exact mesh names. You will need them in Task 4 (layer config).

  If the model does not have separate skull halves, open in Blender:
  1. File → Import → glTF 2.0 → select `glowa.glb`
  2. Select the skull mesh → Edit Mode → select upper half → P → Separate
  3. Rename objects: `skull_left`, `skull_right`, `brain`, `brainstem`
  4. File → Export → glTF 2.0 → `public/models/glowa.glb` (format: glTF Binary)

  **Target mesh names:** `skull_left`, `skull_right`, `brain`, `brainstem`
  (If actual names differ, adjust layer `id` values in Task 4 to match.)

---

## Task 2: Add `AnatomyLayer` type and extend `AnatomicalStructure`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 2.1: Add `AnatomyLayer` interface**

  In `lib/types.ts`, after the `Annotation` interface, add:

  ```ts
  /** Warstwa 3D wewnątrz modelu GLB — jeden mesh */
  export interface AnatomyLayer {
    /** Nazwa meshu w pliku GLB (musi pasować dokładnie) */
    id: string
    /** Etykieta wyświetlana w LayerPanel */
    label: string
    /** Czy warstwa widoczna domyślnie */
    defaultVisible: boolean
    /** true = element pary (np. dwie połówki czaszki) */
    isPair?: boolean
    /** Oś wzdłuż której połówki się rozsuwają przy Split */
    splitAxis?: 'x' | 'y' | 'z'
    /** Dystans rozsunięcia połówki od centrum */
    splitDistance?: number
    /** Kierunek rozsunięcia: 1 = dodatni, -1 = ujemny */
    splitDirection?: 1 | -1
    /** Kierunek eksplozji (wektor znormalizowany * skala) */
    explodeOffset?: [number, number, number]
    /** Pozycja bazowa meshu (override jeśli model nie jest wycentrowany) */
    basePosition?: [number, number, number]
  }
  ```

- [ ] **Step 2.2: Extend `AnatomicalStructure`**

  In `lib/types.ts`, in the `AnatomicalStructure` interface, add the `layers` field after `annotations`:

  ```ts
  /** Struktura anatomiczna z metadanymi */
  export interface AnatomicalStructure {
    id: string
    namePL: string
    nameLAT: string
    system: string
    description: string
    biologicalNotes: string
    annotations: Annotation[]
    /** Warstwy 3D (tylko dla modeli multi-mesh) */
    layers?: AnatomyLayer[]
  }
  ```

- [ ] **Step 2.3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors (layers is optional, existing structures are unaffected).

---

## Task 3: Extend Zustand store with layer state

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 3.1: Add layer state fields and actions**

  Replace the entire contents of `lib/store.ts` with:

  ```ts
  import { create } from 'zustand'
  import { AnatomicalStructure, ChatMessage } from './types'

  interface AppState {
    // Aktualnie wybrana struktura anatomiczna
    selectedStructure: AnatomicalStructure | null
    setSelectedStructure: (structure: AnatomicalStructure | null) => void

    // Historia wiadomości w chacie AI (per sesja)
    chatMessages: ChatMessage[]
    addChatMessage: (message: ChatMessage) => void
    clearChatMessages: () => void

    // Stan ładowania odpowiedzi AI
    isAILoading: boolean
    setIsAILoading: (loading: boolean) => void

    // Trigger do resetowania widoku kamery (inkrementowany przez toolbar)
    cameraResetTrigger: number
    triggerCameraReset: () => void

    // Auto-rotacja modelu 3D
    autoRotate: boolean
    setAutoRotate: (rotate: boolean) => void

    // Widoczność warstw: meshId → czy widoczny
    layerVisibility: Record<string, boolean>
    setLayerVisibility: (meshId: string, visible: boolean) => void
    resetLayerVisibility: () => void

    // Stopień eksplozji 0.0–1.0
    explodeAmount: number
    setExplodeAmount: (amount: number) => void

    // Pozycja płaszczyzny tnącej Y (null = wyłączona)
    clippingPlaneY: number | null
    setClippingPlaneY: (y: number | null) => void

    // Czy połówki czaszki są rozsunięte
    splitOpen: boolean
    setSplitOpen: (open: boolean) => void
  }

  export const useAppStore = create<AppState>((set) => ({
    selectedStructure: null,
    setSelectedStructure: (structure) =>
      set({
        selectedStructure: structure,
        chatMessages: [],
        layerVisibility: {},
        explodeAmount: 0,
        clippingPlaneY: null,
        splitOpen: false,
      }),

    chatMessages: [],
    addChatMessage: (message) =>
      set((state) => ({ chatMessages: [...state.chatMessages, message] })),
    clearChatMessages: () => set({ chatMessages: [] }),

    isAILoading: false,
    setIsAILoading: (loading) => set({ isAILoading: loading }),

    cameraResetTrigger: 0,
    triggerCameraReset: () =>
      set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

    autoRotate: false,
    setAutoRotate: (rotate) => set({ autoRotate: rotate }),

    layerVisibility: {},
    setLayerVisibility: (meshId, visible) =>
      set((state) => ({
        layerVisibility: { ...state.layerVisibility, [meshId]: visible },
      })),
    resetLayerVisibility: () => set({ layerVisibility: {} }),

    explodeAmount: 0,
    setExplodeAmount: (amount) => set({ explodeAmount: amount }),

    clippingPlaneY: null,
    setClippingPlaneY: (y) => set({ clippingPlaneY: y }),

    splitOpen: false,
    setSplitOpen: (open) => set({ splitOpen: open }),
  }))
  ```

- [ ] **Step 3.2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

---

## Task 4: Add `glowa` structure to anatomy data

**Files:**
- Modify: `lib/anatomyData.ts`

- [ ] **Step 4.1: Add `glowa` to the anatomy tree**

  In `lib/anatomyData.ts`, inside the `mozgowie` children array (after `pien`), add:

  ```ts
  { id: 'glowa', label: 'Czaszka i mózg (3D)', structureId: 'glowa' },
  ```

  The `mozgowie` children should now look like:
  ```ts
  children: [
    { id: 'kora', label: 'Kora mózgowa', structureId: 'kora-mozgowa' },
    { id: 'mozdzek', label: 'Móżdżek', structureId: 'mozdzek' },
    { id: 'pien', label: 'Pień mózgu', structureId: 'pien-mozgu' },
    { id: 'glowa', label: 'Czaszka i mózg (3D)', structureId: 'glowa' },
  ],
  ```

- [ ] **Step 4.2: Add the `glowa` structure with layer config**

  In `lib/anatomyData.ts`, in the `structures` object, add after the `'pien-mozgu'` entry:

  ```ts
  glowa: {
    id: 'glowa',
    namePL: 'Czaszka i mózg',
    nameLAT: 'Cranium et Encephalon',
    system: 'Ośrodkowy Układ Nerwowy',
    description:
      'Czaszka (cranium) chroni mózgowie. Składa się z czaszki mózgowej (neurocranium) i trzewioczaszki (viscerocranium). Wewnątrz: mózg właściwy, móżdżek i pień mózgu.',
    biologicalNotes:
      'Czaszka: 22 kości. Mózg: ~1300 g, ~86 mld neuronów. Płyn mózgowo-rdzeniowy (CSF) amortyzuje wstrząsy.',
    annotations: [],
    layers: [
      {
        id: 'skull_left',
        label: 'Czaszka — lewa połówka',
        defaultVisible: true,
        isPair: true,
        splitAxis: 'x',
        splitDistance: 1.5,
        splitDirection: -1,
        explodeOffset: [-0.8, 0.2, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'skull_right',
        label: 'Czaszka — prawa połówka',
        defaultVisible: true,
        isPair: true,
        splitAxis: 'x',
        splitDistance: 1.5,
        splitDirection: 1,
        explodeOffset: [0.8, 0.2, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'brain',
        label: 'Mózg',
        defaultVisible: true,
        explodeOffset: [0, 1.0, 0],
        basePosition: [0, 0, 0],
      },
      {
        id: 'brainstem',
        label: 'Pień mózgu',
        defaultVisible: true,
        explodeOffset: [0, -0.5, 0.6],
        basePosition: [0, 0, 0],
      },
    ],
  },
  ```

  > **Note:** If the mesh names in your GLB differ from `skull_left`, `skull_right`, `brain`, `brainstem`, update the `id` field in each layer to match the exact mesh name you found in Task 1.2. The `splitDistance`, `explodeOffset`, and `basePosition` values may also need tweaking depending on model scale — adjust after testing in browser.

- [ ] **Step 4.3: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

---

## Task 5: Create `LayeredModel.tsx`

**Files:**
- Create: `components/Viewer3D/LayeredModel.tsx`

- [ ] **Step 5.1: Create the file with layer utility function**

  Create `components/Viewer3D/LayeredModel.tsx`:

  ```tsx
  'use client'

  import { useGLTF } from '@react-three/drei'
  import { useFrame } from '@react-three/fiber'
  import { useEffect, useRef } from 'react'
  import * as THREE from 'three'
  import { useAppStore } from '@/lib/store'
  import { AnatomyLayer } from '@/lib/types'

  /**
   * Oblicza docelową pozycję meshu na podstawie stanu warstw.
   * Eksportowane do testów jednostkowych.
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

    // Refs do meshów — uzupełniane po załadowaniu sceny
    const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map())
    const clippingPlane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0))

    // Zbuduj mapę meshRef po załadowaniu sceny
    useEffect(() => {
      meshRefs.current.clear()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          meshRefs.current.set(obj.name, obj)
        }
      })
    }, [scene])

    useFrame((_, delta) => {
      // Współczynnik lerp: frame-rate niezależny, ~0.5s do 99% celu
      const t = 1 - Math.pow(0.001, delta)

      meshRefs.current.forEach((mesh, name) => {
        const config = layerConfig.find((l) => l.id === name)
        if (!config) return

        // Widoczność z store, fallback na defaultVisible
        const visible = layerVisibility[name] ?? config.defaultVisible
        mesh.visible = visible

        if (!visible) return

        // Animacja pozycji (lerp)
        const target = getLayerTargetPosition(config, explodeAmount, splitOpen)
        mesh.position.lerp(target, t)

        // Płaszczyzna tnąca
        const mat = mesh.material as THREE.MeshStandardMaterial
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
  ```

- [ ] **Step 5.2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

---

## Task 6: Create `LayerPanel.tsx`

**Files:**
- Create: `components/Viewer3D/LayerPanel.tsx`

- [ ] **Step 6.1: Create the floating layer panel**

  Create `components/Viewer3D/LayerPanel.tsx`:

  ```tsx
  'use client'

  import { useAppStore } from '@/lib/store'
  import { AnatomyLayer } from '@/lib/types'

  interface LayerPanelProps {
    layers: AnatomyLayer[]
  }

  /**
   * Floating panel w prawym dolnym rogu viewera 3D.
   * Wyświetla listę warstw z togglem widoczności (ikona oka).
   * Pojawia się tylko gdy aktywna struktura ma zdefiniowane warstwy.
   */
  export function LayerPanel({ layers }: LayerPanelProps) {
    const { layerVisibility, setLayerVisibility } = useAppStore()

    const isVisible = (layer: AnatomyLayer) =>
      layerVisibility[layer.id] ?? layer.defaultVisible

    const toggle = (layer: AnatomyLayer) => {
      setLayerVisibility(layer.id, !isVisible(layer))
    }

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          right: '16px',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '10px 12px',
          minWidth: '180px',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: '8px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Warstwy
        </p>

        {layers.map((layer) => {
          const visible = isVisible(layer)
          return (
            <div
              key={layer.id}
              onClick={() => toggle(layer)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 4px',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: visible ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Ikona oka */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={visible ? '#a78bfa' : 'rgba(255,255,255,0.4)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {visible ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>

              <span
                style={{
                  fontSize: '12px',
                  color: visible ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                }}
              >
                {layer.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  ```

- [ ] **Step 6.2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

---

## Task 7: Update `Viewer3D.tsx`

**Files:**
- Modify: `components/Viewer3D/Viewer3D.tsx`

This is the largest change. Replace the entire file with the version below. Key changes:
- `Canvas` gets `gl={{ localClippingEnabled: true }}` — required for `clippingPlanes` on materials
- Toolbar gets Split, Explode, Cross-Section as functional buttons
- Explode and Cross-Section show inline sliders beneath the toolbar when active
- `LayerPanel` appears when selected structure has `layers`
- `ModelLoader` routing: structures with `layers` use `LayeredModel`, others use the existing `GLBModel`
- `triggerCameraReset` also resets `explodeAmount`, `clippingPlaneY`, `splitOpen`

- [ ] **Step 7.1: Replace Viewer3D.tsx**

  Replace the entire contents of `components/Viewer3D/Viewer3D.tsx` with:

  ```tsx
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
      if (!next) setClippingPlaneY(null)
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
        {/* Główny toolbar */}
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
          {/* Rotate */}
          <ToolbarBtn
            label="Rotate"
            active={autoRotate}
            onClick={() => setAutoRotate(!autoRotate)}
          />

          {/* Split — tylko przy modelach z warstwami */}
          <ToolbarBtn
            label="Split"
            active={splitOpen}
            disabled={!hasLayers}
            onClick={handleSplit}
          />

          {/* Explode */}
          <ToolbarBtn
            label="Explode"
            active={showExplodeSlider}
            disabled={!hasLayers}
            onClick={handleExplode}
          />

          {/* Cross-Section */}
          <ToolbarBtn
            label="Cross-Section"
            active={showClipSlider}
            disabled={!hasLayers}
            onClick={handleCrossSection}
          />

          {/* Reset */}
          <ToolbarBtn label="Reset View" onClick={handleReset} />
        </div>

        {/* Slider Explode */}
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

        {/* Slider Cross-Section */}
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

        {/* Layer Panel — tylko dla modeli z warstwami */}
        {hasLayers && selectedStructure?.layers && (
          <LayerPanel layers={selectedStructure.layers} />
        )}

        {/* Podpowiedź gdy brak modelu */}
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

        {/* Gradient na dole */}
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
  ```

- [ ] **Step 7.2: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```
  Expected: no errors.

---

## Task 8: Integration test in browser

- [ ] **Step 8.1: Start dev server**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000` in browser.

- [ ] **Step 8.2: Verify base functionality unchanged**

  - Left panel tree loads correctly
  - Selecting "Serce" loads `serce.glb` model
  - OrbitControls, WASD, Reset View, Rotate buttons still work
  - LayerPanel does NOT appear for "Serce" (no layers)

- [ ] **Step 8.3: Verify glowa structure appears in tree**

  - In left panel, under "Ośrodkowy Układ Nerwowy → Mózgowie", "Czaszka i mózg (3D)" appears
  - Clicking it shows Polish/Latin name in right panel

- [ ] **Step 8.4: Verify layered model loads (requires glowa.glb)**

  Place `glowa.glb` in `public/models/` then:
  - Select "Czaszka i mózg (3D)"
  - Model renders in 3D viewer
  - LayerPanel appears bottom-right with 4 layers: Czaszka L, Czaszka P, Mózg, Pień mózgu

- [ ] **Step 8.5: Test Split button**

  - Click "Split" in toolbar — skull halves animate apart (~0.5s)
  - Click "Split" again — halves return to center
  - Layers with `isPair: true` (skull_left, skull_right) are the ones that move

- [ ] **Step 8.6: Test Explode slider**

  - Click "Explode" — slider appears beneath toolbar
  - Drag slider to 1.0 — all layers animate outward along their `explodeOffset` vectors
  - Drag back to 0.0 — layers return to original positions

- [ ] **Step 8.7: Test Cross-Section slider**

  - Click "Cross-Section" — slider appears
  - Drag slider — a horizontal clipping plane cuts through the model
  - Drag to opposite end — plane exits model from other side
  - Click "Cross-Section" again — plane removed, full model visible

- [ ] **Step 8.8: Test Layer Panel toggles**

  - Click eye icon next to "Mózg" — brain mesh disappears
  - Click again — brain mesh reappears
  - Combine with Split: hide skull halves, then Split — only brain visible and centred

- [ ] **Step 8.9: Test Reset View**

  - Set up: Split open, Explode at 0.8, some layers hidden
  - Click "Reset View" — camera resets AND all layers return to default state (split closed, explode 0, all visible)

- [ ] **Step 8.10: Adjust layer offsets if needed**

  If animations look wrong (meshes snap too far, offsets don't match model scale):
  - Edit `splitDistance` and `explodeOffset` values in `lib/anatomyData.ts` for the `glowa` structure
  - Save → hot reload → re-test
  - Common adjustment: if model is much larger/smaller than 1 unit, scale all distances proportionally

---

## Troubleshooting

**Mesh not animating / not found:**
Layer `id` doesn't match mesh name in GLB. Run `npx gltf-transform inspect public/models/glowa.glb` and compare output with `id` values in `glowa.layers` in `anatomyData.ts`. Update `id` values to match.

**Clipping plane has no effect:**
Check that `<Canvas gl={{ localClippingEnabled: true }}>` is set in `Viewer3D.tsx`. Without this flag, Three.js ignores `clippingPlanes` on materials.

**TypeScript error on `mesh.material.clippingPlanes`:**
The type of `mesh.material` is `THREE.Material | THREE.Material[]`. Cast it:
```ts
const mat = Array.isArray(mesh.material)
  ? mesh.material[0] as THREE.MeshStandardMaterial
  : mesh.material as THREE.MeshStandardMaterial
```
Apply this in `LayeredModel.tsx` where `mat.clippingPlanes` is set.

**Model too large/small in viewer:**
Add scale to `LayeredModel`:
```tsx
return <primitive object={scene} scale={0.01} />
```
Adjust the number until the model fits in view at camera distance 5.
