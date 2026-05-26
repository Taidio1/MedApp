# Viewer UI Improvements — Design Spec
_2026-05-24_

## Cel

Poprawić realizm wizualny organów w scenie 3D oraz użyteczność aplikacji przy nauce i prezentacji, zachowując istniejącą jasną paletę kolorystyczną.

## Zakres plików

| Plik | Zmiana |
|------|--------|
| `components/Viewer3D/Viewer3D.tsx` | tło sceny, oświetlenie, toolbar z Lucide, usunięcie export-toolbar i view-card, loading fallback |
| `components/Viewer3D/Annotations.tsx` | kolory anotacji wg warstwy, oddzielenie hover od click |
| `app/globals.css` | vignette na `.canvas-wrap`, legenda warstw, loading fallback styles |
| `package.json` | dodanie `lucide-react` |

Brak zmian w: store, typach, backendzie, pozostałych panelach.

---

## 1. Scena 3D — tło, oświetlenie, vignette

### Tło sceny

Canvas pozostaje z `alpha: true`. Background sceny Three.js (`<color>`) ustawiamy na `#fff9f2` (jaśniejszy niż obecny `#fbf7ee`). Fog zmienia się na ten sam jasny kolor.

Element `.canvas-wrap` w CSS dostaje `background`:

```css
background: radial-gradient(ellipse 60% 70% at 50% 50%, #fff9f2 0%, #e8dfc8 100%);
```

Efekt: organ pojawia się na tle "reflektora" — centrum jasne, krawędzie lekko głębsze — bez ciemnienia całości.

### Oświetlenie anatomiczne

Redukujemy ambient który rozmywa cienie, wzmacniamy kierunkowe:

| Światło | Obecne | Nowe |
|---------|--------|------|
| `ambientLight` | `intensity={1.24}` | `intensity={0.45}` |
| `hemisphereLight` | `intensity={1.16}` | `intensity={0.7}` |
| `directionalLight` (key) | `[4.2, 5.2, 5.8] intensity={2.5}` | `[3, 4, 4] intensity={1.8}` |
| `directionalLight` (fill) | `[-4.4, 2.2, 3.6] intensity={0.54}` | `[-3, -1, 2] intensity={0.4}` |
| `pointLight` | `[2.8, -1.2, 3.2] intensity={0.55}` | **usunięty** (nadmiarowy) |

Efekt: głębsze cienie na zagłębieniach organu, wyraźna faktura powierzchni, zachowana jasna paleta.

### Vignette CSS

Pseudo-element `::after` na `.canvas-wrap`:

```css
.canvas-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.08) 100%);
}
```

Subtelne przyciemnienie krawędzi bez naruszenia jasnej palety.

---

## 2. Anotacje — kolory, hover/click, performance

### Kolory wg warstwy (konwencja medyczna)

```ts
const LAYER_COLORS: Record<string, string> = {
  organ:      '#e05252',
  vessels:    '#4a7fc1',
  nerves:     '#d4a017',
  clinical:   '#d07a30',
  topography: '#4a9e6b',
}
const FALLBACK_COLOR = '#fbbf24'
```

Kolor punktu wyznaczany przez pierwszą warstwę z `annotation.layerIds`. Aktywny punkt: `color-mix(in srgb, <kolor> 80%, white 20%)`. Halo pulsujące w kolorze warstwy.

### Oddzielenie hover od click

**Przed:** `onPointerOver` → `setActiveAnnotation(annotation)` — każdy ruch myszy triggeruje global store re-render.

**Po:**
- `onPointerOver` / `onPointerOut` → lokalny `useState<boolean>(false)` w `AnnotationPoint` — tylko zmiana skali punktu jako feedback wizualny
- `onClick` → jedyna akcja wywołująca `setActiveAnnotation` i `setSelectedStructure`

Zero zmian w interfejsie `Annotation` ani store.

### Legenda warstw

Komponent `AnnotationLegend` — absolutnie pozycjonowany w prawym dolnym rogu sceny (poza canvas, czysty DOM). Widoczny gdy `selectedStructure` istnieje i ma anotacje z przypisanymi layerIds. Pokazuje: kolorowy kwadracik + nazwa warstwy po polsku.

```
● Organ
● Naczynia
● Nerwy
● Kliniczne
● Topografia
```

Stylizacja: `var(--paper)`, `var(--line)` border, font-size 0.72rem, border-radius 8px.

---

## 3. Toolbar — ikony Lucide, czyszczenie UI

### Lucide React

```bash
npm install lucide-react
```

Prop `icon` dodany do `ToolbarBtn`:

```tsx
interface ToolbarBtnProps {
  label: string
  icon: React.ReactNode  // <RotateCcw size={15} />
  active?: boolean
  disabled?: boolean
  onClick: () => void
}
```

Mapowanie ikon:

| Przycisk | Ikona |
|----------|-------|
| Obrót | `<RotateCcw />` |
| Split | `<SplitSquareHorizontal />` |
| Rozsuń | `<Maximize2 />` |
| Wycinek | `<Scissors />` |
| Reset | `<RefreshCw />` |

### Usunięcia z Viewer3D.tsx

- Cały blok `<div className="export-toolbar">` (Screenshot + GLB Export)
- Cały blok `<div className="view-card">` (Mesh/Focus + Cross Section toggle — dekoracyjny)

### Usunięcia z globals.css

- Klasa `.export-toolbar` i jej reguły
- Klasy `.view-card`, `.view-card-title`, `.mode-switcher`, `.mode-button`, `.toggle-line`, `.toggle-track`

---

## 4. Stan ładowania modelu

### Komponent ModelLoadingFallback

Absolutnie pozycjonowany nad canvas (poza Three.js, tak jak `AnnotationDetailPanel`). Renderowany jako `fallback` w `<Suspense>`.

```tsx
function ModelLoadingFallback() {
  return (
    <div className="model-loading-fallback">
      <div className="model-loading-spinner" />
      <span>Ładowanie modelu...</span>
    </div>
  )
}
```

CSS:

```css
.model-loading-fallback {
  position: absolute;
  inset: 0;
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

---

## Decyzje projektowe

- Jasna paleta kolorystyczna zachowana we wszystkich zmianach
- Brak nowych plików komponentów — wszystkie zmiany w istniejących plikach
- Brak zmian w store, typach, backendzie
- `lucide-react` jedyna nowa dependencja
- Legenda warstw renderowana w DOM (nie w Three.js) dla łatwości stylowania
- Loading fallback poza canvas — nie wymaga zmian w logice `useGLTF`
