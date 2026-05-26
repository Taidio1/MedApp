# Viewer UI Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poprawić realizm wizualny organów w scenie 3D oraz użyteczność przy prezentacji — kolor-coded anotacje, lepsze oświetlenie, ikony w toolbarze, spinner ładowania.

**Architecture:** Zmiany w 4 plikach bez nowych komponentów-plików. Każdy task jest niezależny i produkcyjnie bezpieczny. Logika store/typów nie zmienia się.

**Tech Stack:** Next.js 16 App Router, React Three Fiber v9, @react-three/drei v10, Three.js 0.184, lucide-react (nowa dep), Tailwind CSS v4 + globals.css

---

## File Map

| Plik | Zmiany |
|------|--------|
| `package.json` | +`lucide-react` |
| `components/Viewer3D/Viewer3D.tsx` | oświetlenie, toolbar icons, usunięcie view-card+export-toolbar, LoadingOverlay, AnnotationLegend |
| `components/Viewer3D/Annotations.tsx` | LAYER_COLORS, getAnnotationColor, hover state lokalny zamiast store |
| `app/globals.css` | canvas-wrap gradient+vignette, toolbar CSS cleanup, loading styles, legend styles |

---

## Task 1: Zainstaluj lucide-react

**Files:**
- Modify: `package.json` (automatycznie przez npm)

- [ ] **Step 1: Zainstaluj paczkę**

```bash
npm install lucide-react
```

Expected output: `added 1 package` lub similar. Brak błędów.

- [ ] **Step 2: Sprawdź że ikona importuje się poprawnie**

```bash
node -e "const { RotateCcw } = require('lucide-react'); console.log(typeof RotateCcw)"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react for toolbar icons"
```

---

## Task 2: Scena 3D — tło, oświetlenie, vignette

**Files:**
- Modify: `components/Viewer3D/Viewer3D.tsx` (linie 362–369 — światła)
- Modify: `app/globals.css` (linia 424 — `.canvas-wrap`)

### Viewer3D.tsx — oświetlenie

- [ ] **Step 1: Zastąp blok świateł wewnątrz Canvas**

Znajdź ten blok (linie ~365–369):
```tsx
            <ambientLight intensity={1.24} />
            <hemisphereLight args={['#fff8ea', '#e3ded2', 1.16]} />
            <directionalLight position={[4.2, 5.2, 5.8]} intensity={2.5} />
            <directionalLight position={[-4.4, 2.2, 3.6]} intensity={0.54} color="#fff1df" />
            <pointLight position={[2.8, -1.2, 3.2]} intensity={0.55} color="#ffffff" />
```

Zastąp go:
```tsx
            <ambientLight intensity={0.45} />
            <hemisphereLight args={['#fff8ea', '#e3ded2', 0.7]} />
            <directionalLight position={[3, 4, 4]} intensity={1.8} />
            <directionalLight position={[-3, -1, 2]} intensity={0.4} color="#fff1df" />
```

- [ ] **Step 2: Zmień kolor tła sceny i fog**

Znajdź:
```tsx
            <color attach="background" args={['#fbf7ee']} />
            <fog attach="fog" args={['#fbf7ee', 9, 18]} />
```

Zastąp:
```tsx
            <color attach="background" args={['#fff9f2']} />
            <fog attach="fog" args={['#fff9f2', 9, 18]} />
```

### globals.css — canvas-wrap gradient + vignette

- [ ] **Step 3: Zaktualizuj `.canvas-wrap`**

Znajdź:
```css
.canvas-wrap {
  position: absolute;
  inset: 178px 22px 120px;
  z-index: 1;
}
```

Zastąp:
```css
.canvas-wrap {
  position: absolute;
  inset: 178px 22px 120px;
  z-index: 1;
  overflow: hidden;
  border-radius: 6px;
  background: radial-gradient(ellipse 60% 70% at 50% 50%, #fff9f2 0%, #e8dfc8 100%);
}

.canvas-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.08) 100%);
}
```

- [ ] **Step 4: Uruchom dev server i sprawdź wizualnie**

```bash
npm run dev
```

Otwórz http://localhost:3000, wybierz dowolną strukturę z lewego panelu. Oczekiwane: tło sceny ma lekki gradient (centrum jaśniejsze), cienie na modelu są głębsze, subtelna winietka na krawędziach.

- [ ] **Step 5: Commit**

```bash
git add components/Viewer3D/Viewer3D.tsx app/globals.css
git commit -m "feat: anatomical lighting and radial gradient scene background"
```

---

## Task 3: Toolbar — ikony Lucide + usunięcie view-card i export-toolbar

**Files:**
- Modify: `components/Viewer3D/Viewer3D.tsx`
- Modify: `app/globals.css`

### Viewer3D.tsx — import + ToolbarBtn + ViewerToolbar

- [ ] **Step 1: Dodaj import lucide-react na górze pliku**

Po linii `import { useAppStore } from '@/lib/store'` dodaj:
```tsx
import { RotateCcw, Columns, Maximize2, Scissors, RefreshCw } from 'lucide-react'
```

- [ ] **Step 2: Zastąp ToolbarBtn**

Znajdź i zastąp cały komponent `ToolbarBtn`:
```tsx
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
```

Nowa wersja:
```tsx
function ToolbarBtn({
  icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode
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
      {icon}
      {label}
    </button>
  )
}
```

- [ ] **Step 3: Zastąp zawartość `<div className="viewer-toolbar">` w ViewerToolbar**

Znajdź blok:
```tsx
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
```

Zastąp:
```tsx
      <div className="viewer-toolbar">
        <ToolbarBtn
          icon={<RotateCcw size={15} />}
          label="Obrót"
          active={autoRotate}
          onClick={() => setAutoRotate(!autoRotate)}
        />
        <ToolbarBtn
          icon={<Columns size={15} />}
          label="Split"
          active={splitOpen}
          disabled={!hasLayers}
          onClick={handleSplit}
        />
        <ToolbarBtn
          icon={<Maximize2 size={15} />}
          label="Rozsuń"
          active={showExplodeSlider}
          disabled={!hasLayers}
          onClick={handleExplode}
        />
        <ToolbarBtn
          icon={<Scissors size={15} />}
          label="Wycinek"
          active={showClipSlider}
          disabled={!hasLayers}
          onClick={handleCrossSection}
        />
        <ToolbarBtn icon={<RefreshCw size={15} />} label="Reset" onClick={handleReset} />
      </div>
```

- [ ] **Step 4: Usuń `<div className="export-toolbar">` z returna Viewer3D**

Znajdź i usuń cały blok:
```tsx
      <div className="export-toolbar">
        <button type="button">Screenshot</button>
        <button type="button">GLB Export</button>
      </div>
```

- [ ] **Step 5: Usuń `<div className="view-card">` ze `stage-title`**

Znajdź w returnie Viewer3D (wersja z modelem) blok `<div className="view-card">` i usuń go. Po zmianie `stage-title` wygląda tak:
```tsx
      <div className="stage-title">
        <div>
          <h2>{selectedStructure?.namePL ?? 'Atlas 3D'}</h2>
          <p>{selectedStructure?.nameLAT ?? 'Wybierz strukturę z panelu po lewej'}</p>
        </div>
      </div>
```

### globals.css — usunięcie CSS view-card i export-toolbar, aktualizacja insetów

- [ ] **Step 6: Usuń blok CSS `.view-card` do `.toggle-track::after`**

Znajdź i usuń całe reguły od `.view-card {` do końca `.toggle-line input:checked + .toggle-track::after { transform: translateX(24px); }` (linie 331–422). Są to klasy: `.view-card`, `.view-card-title`, `.mode-switcher`, `.mode-button`, `.mode-button:hover`, `.mode-button.is-active`, `.toggle-line`, `.toggle-line input`, `.toggle-track`, `.toggle-track::after`, `.toggle-line input:checked + .toggle-track`, `.toggle-line input:checked + .toggle-track::after`.

- [ ] **Step 7: Rozdziel `.viewer-toolbar, .export-toolbar` na samodzielny `.viewer-toolbar`**

Znajdź:
```css
.viewer-toolbar,
.export-toolbar {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(84, 74, 58, 0.14);
  border-radius: 8px;
  background: rgba(251, 247, 238, 0.88);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
}
```

Zastąp (usuń `.export-toolbar`):
```css
.viewer-toolbar {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(84, 74, 58, 0.14);
  border-radius: 8px;
  background: rgba(251, 247, 238, 0.88);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
}
```

- [ ] **Step 8: Usuń `.export-toolbar { right: 34px; bottom: 28px; }` (osobny blok po `.viewer-toolbar { left: 34px; bottom: 28px; }`)**

Znajdź i usuń:
```css
.export-toolbar {
  right: 34px;
  bottom: 28px;
}
```

- [ ] **Step 9: Uproszcz pozostałe reguły button — usuń `.export-toolbar button` z selektorów**

Znajdź:
```css
.viewer-toolbar button,
.export-toolbar button {
```
Zastąp: `.viewer-toolbar button {`

Znajdź:
```css
.viewer-toolbar button:last-child,
.export-toolbar button:last-child {
```
Zastąp: `.viewer-toolbar button:last-child {`

Znajdź:
```css
.viewer-toolbar button:hover,
.viewer-toolbar button.is-active,
.export-toolbar button:hover {
```
Zastąp: `.viewer-toolbar button:hover, .viewer-toolbar button.is-active {`

- [ ] **Step 10: Zaktualizuj inset canvas-wrap — mniejszy top bo view-card usunięty**

Domyślny (obecny): `inset: 178px 22px 120px` → `inset: 130px 22px 88px`

Znajdź wszystkie wystąpienia `.canvas-wrap` z inset i zaktualizuj:

W `@media (max-width: 1400px)`:
```css
.canvas-wrap {
  inset: 156px 18px 140px;
}
```
→
```css
.canvas-wrap {
  inset: 106px 18px 88px;
}
```

W `@media (max-width: 1080px)`:
```css
.canvas-wrap {
  inset: 300px 12px 166px;
}
```
→
```css
.canvas-wrap {
  inset: 130px 12px 104px;
}
```

W `@media (max-width: 720px)`:
```css
.canvas-wrap {
  inset: 300px 10px 178px;
}
```
→
```css
.canvas-wrap {
  inset: 130px 10px 150px;
}
```

- [ ] **Step 11: Usuń pozostałe `.export-toolbar` z media queries**

W `@media (max-width: 1500px)` usuń cały blok (jeśli zawiera tylko export-toolbar):
```css
  .export-toolbar {
    bottom: 86px;
  }
```

W `@media (max-width: 720px)` usuń `.export-toolbar` z:
```css
  .viewer-toolbar,
  .export-toolbar {
    left: 20px;
    right: 20px;
    justify-content: stretch;
  }
```
→
```css
  .viewer-toolbar {
    left: 20px;
    right: 20px;
    justify-content: stretch;
  }
```

Usuń:
```css
  .export-toolbar {
    bottom: 20px;
  }
```

Usuń `.export-toolbar button` z:
```css
  .viewer-toolbar button,
  .export-toolbar button {
    flex: 1 0 auto;
    padding: 0 10px;
  }
```
→
```css
  .viewer-toolbar button {
    flex: 1 0 auto;
    padding: 0 10px;
  }
```

W `@media (max-width: 1080px)` usuń:
```css
  .view-card {
    width: 100%;
  }
```

- [ ] **Step 12: Uruchom dev server, sprawdź wizualnie toolbar**

```bash
npm run dev
```

Sprawdź: przyciski toolbar mają ikony + etykiety, brak sekcji export-toolbar i view-card, scena ma właściwy inset (model widoczny, nie zakryty przez panele).

- [ ] **Step 13: Sprawdź TypeScript**

```bash
npm run build 2>&1 | head -40
```

Expected: brak TypeScript errors dotyczących `ToolbarBtn`.

- [ ] **Step 14: Commit**

```bash
git add components/Viewer3D/Viewer3D.tsx app/globals.css
git commit -m "feat: lucide icons in toolbar, remove decorative view-card and export-toolbar"
```

---

## Task 4: Loading state — spinner podczas ładowania GLB

**Files:**
- Modify: `components/Viewer3D/Viewer3D.tsx`
- Modify: `app/globals.css`

### Viewer3D.tsx — komponent LoadingOverlay

- [ ] **Step 1: Dodaj import useProgress**

Na górze pliku, w imporcie z `@react-three/drei`:
```tsx
import { ContactShadows, OrbitControls, useProgress } from '@react-three/drei'
```

- [ ] **Step 2: Dodaj komponent LoadingOverlay po AnnotationDetailPanel (przed funkcją WASDControls)**

```tsx
function LoadingOverlay() {
  const { active } = useProgress()
  if (!active) return null
  return (
    <div className="model-loading-fallback">
      <div className="model-loading-spinner" />
      <span>Ładowanie modelu...</span>
    </div>
  )
}
```

- [ ] **Step 3: Umieść LoadingOverlay wewnątrz `.canvas-wrap`**

Znajdź:
```tsx
      <div className="canvas-wrap">
        <div className="viewer3d-scene">
```

Zastąp:
```tsx
      <div className="canvas-wrap">
        <LoadingOverlay />
        <div className="viewer3d-scene">
```

### globals.css — style spinnera

- [ ] **Step 4: Dodaj style loading przed `.canvas-wrap`**

Wstaw przed regułą `.canvas-wrap {`:
```css
.model-loading-fallback {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--accent);
  font-size: 0.85rem;
  pointer-events: none;
}

.model-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--accent-soft);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 5: Sprawdź loading state**

W przeglądarce wybierz strukturę — przez 1–3 sekundy powinien być widoczny spinner. Jeśli model jest already cached (szybkie ładowanie), spróbuj hard-refresh (Ctrl+Shift+R) i wybierz strukturę ponownie.

- [ ] **Step 6: Commit**

```bash
git add components/Viewer3D/Viewer3D.tsx app/globals.css
git commit -m "feat: loading spinner for 3D model via useProgress"
```

---

## Task 5: Anotacje — kolory medyczne, hover/click, legenda

**Files:**
- Modify: `components/Viewer3D/Annotations.tsx`
- Modify: `components/Viewer3D/Viewer3D.tsx`
- Modify: `app/globals.css`

### Annotations.tsx — pełny rewrite komponentu

- [ ] **Step 1: Zastąp zawartość Annotations.tsx**

```tsx
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
```

### Viewer3D.tsx — komponent AnnotationLegend

- [ ] **Step 2: Dodaj stałe i komponent AnnotationLegend w Viewer3D.tsx**

Wstaw przed funkcją `ViewerWelcome`:
```tsx
const LEGEND_COLORS: Record<string, string> = {
  organ:      '#e05252',
  vessels:    '#4a7fc1',
  nerves:     '#d4a017',
  clinical:   '#d07a30',
  topography: '#4a9e6b',
}

const LEGEND_LABELS: Record<string, string> = {
  organ:      'Organ',
  vessels:    'Naczynia',
  nerves:     'Nerwy',
  clinical:   'Kliniczne',
  topography: 'Topografia',
}

function AnnotationLegend() {
  const selectedStructure = useAppStore((s) => s.selectedStructure)

  if (!selectedStructure) return null

  const usedLayers = Array.from(
    new Set(selectedStructure.annotations.flatMap((a) => a.layerIds ?? []))
  )

  if (usedLayers.length === 0) return null

  return (
    <div className="annotation-legend">
      {usedLayers.map((layer) => (
        <div key={layer} className="annotation-legend-item">
          <span
            className="annotation-legend-dot"
            style={{ background: LEGEND_COLORS[layer] ?? '#fbbf24' }}
          />
          <span>{LEGEND_LABELS[layer] ?? layer}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Umieść AnnotationLegend w returnie Viewer3D (wersja z modelem)**

Po `<AnnotationDetailPanel />` dodaj:
```tsx
      <AnnotationLegend />
```

### globals.css — style legendy

- [ ] **Step 4: Dodaj style legendy anotacji**

Na końcu pliku (przed ostatnią klamrą lub po ostatniej regule):
```css
.annotation-legend {
  position: absolute;
  z-index: 6;
  right: 20px;
  bottom: 96px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(251, 247, 238, 0.88);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-soft);
}

.annotation-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--ink);
  white-space: nowrap;
}

.annotation-legend-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
}
```

- [ ] **Step 5: Sprawdź wizualnie anotacje**

W przeglądarce wybierz strukturę z anotacjami. Sprawdź:
- Punkty mają różne kolory (np. czerwony dla organ, niebieski dla vessels)
- Hover na punkcie zwiększa go subtelnie ale NIE otwiera panelu szczegółów
- Kliknięcie punktu otwiera panel szczegółów
- W prawym dolnym rogu sceny pojawia się legenda z kolorami

- [ ] **Step 6: TypeScript check**

```bash
npm run build 2>&1 | head -40
```

Expected: brak błędów.

- [ ] **Step 7: Commit**

```bash
git add components/Viewer3D/Annotations.tsx components/Viewer3D/Viewer3D.tsx app/globals.css
git commit -m "feat: color-coded annotations by medical layer, annotation legend, fix hover vs click"
```

---

## Self-Review

**Spec coverage:**
- [x] Tło sceny radial-gradient → Task 2
- [x] Oświetlenie anatomiczne → Task 2
- [x] Vignette CSS → Task 2
- [x] Kolory anotacji wg warstwy (medyczne) → Task 5
- [x] Hover lokalny / click store → Task 5
- [x] Legenda warstw → Task 5
- [x] Lucide icons w toolbarze → Task 3
- [x] Usunięcie export-toolbar → Task 3
- [x] Usunięcie view-card → Task 3
- [x] Loading spinner → Task 4
- [x] lucide-react install → Task 1

**Placeholder scan:** Brak TBD/TODO. Każdy krok ma konkretny kod.

**Type consistency:** `AnnotationPoint` używa `Annotation` z `@/lib/types` — bez zmian. `ToolbarBtn` dodaje `icon: React.ReactNode` — prop opcjonalny w istniejących callsites nie jest wymagany, więc nie ma regresji w typach.

**Uwaga na inset canvas-wrap:** Wartości `130px` (top) i `88px` (bottom) to szacunki oparte na wysokości stage-title bez view-card. Jeśli layout nie pasuje po wdrożeniu Task 3, dostosuj wartości inset wizualnie — zmiana jest jednolinijkowa w globals.css.
