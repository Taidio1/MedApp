# Design: Dymki adnotacji 3D

**Data:** 2026-05-21  
**Zakres:** Mechanizm wyświetlania dymków z opisem przy punktach adnotacji na modelach 3D

---

## Cel

Dodanie interaktywnych dymków (speech bubbles) do istniejących punktów adnotacji w przeglądarce 3D. Po najechaniu na żółty punkt adnotacji pojawia się dymek z pełną informacją medyczną: nazwą polską, nazwą łacińską i krótkim opisem.

---

## Zmieniane pliki

Tylko dwa pliki:

1. `lib/types.ts` — rozszerzenie interfejsu `Annotation`
2. `components/Viewer3D/Annotations.tsx` — wzbogacony dymek hover

---

## Szczegóły implementacji

### 1. `lib/types.ts`

Interfejs `Annotation` otrzymuje dwa opcjonalne pola:

```typescript
export interface Annotation {
  id: string
  label: string          // nazwa PL (już istnieje)
  nameLAT?: string       // nowe: nazwa łacińska (opcjonalne)
  description?: string   // nowe: krótki opis 1–2 zdania (opcjonalne)
  position: [number, number, number]
  structureId: string
}
```

Pola są opcjonalne — istniejące adnotacje bez nich działają bez zmian.

### 2. `components/Viewer3D/Annotations.tsx`

Komponent `AnnotationPoint` renderuje wzbogacony dymek w bloku `{hovered && <Html>}`.

**Struktura dymka (HTML w `<Html distanceFactor={10}>`):**

```
┌─────────────────────────┐
│  Komora lewa            │  ← label, pogrubiony, kolor #a78bfa
│  Ventriculus sinister   │  ← nameLAT, kursywa, kolor #818cf8 (jeśli istnieje)
│ ─────────────────────── │  ← separator (jeśli istnieje nameLAT lub description)
│  Pompuje krew do        │  ← description, zawijany, kolor #c4b5fd (jeśli istnieje)
│  krążenia ogólnego...   │
└─────────────────────────┘
              ▼            ← trójkątna strzałka wskazująca na punkt
```

**Styl dymka:**
- tło: `#1e1b4b`
- ramka: `1px solid #7c3aed`
- border-radius: `10px`
- max-width: `220px`
- `white-space: normal` (tekst się zawija)
- `pointer-events: none` (dymek nie blokuje interakcji z modelem)
- strzałka: trójkąt CSS na dole, kolor `#7c3aed`

**Renderowanie warunkowe:**
- `nameLAT` — wyświetlane tylko gdy pole istnieje i nie jest puste
- `description` — wyświetlane tylko gdy pole istnieje i nie jest puste
- separator `<hr>` — wyświetlany tylko gdy istnieje `nameLAT` lub `description`
- Gdy brak obu pól → dymek pokazuje tylko `label` (pełna wsteczna kompatybilność)

---

## Zachowanie brzegowe

| Sytuacja | Zachowanie |
|---|---|
| Adnotacja bez `nameLAT` i `description` | Dymek pokazuje tylko `label` |
| Długi opis | Tekst zawija się, max-width 220px |
| Punkt blisko krawędzi | `<Html>` drei obsługuje automatycznie |
| Autorotacja włączona | Dymek podąża za punktem w przestrzeni 3D |

---

## Poza zakresem

- Dodawanie danych dla nowych modeli (`kidney`, `liver`, `lung`, `stomach`) — robi to użytkownik ręcznie
- Zmiany w backendzie
- Nowe zależności npm
- Zmiany w store (`lib/store.ts`)

---

## Jak dodawać dane po implementacji

```typescript
// lib/anatomyData.ts — przykład wypełnienia pól
{ 
  id: 'ann-serce-1', 
  label: 'Komora lewa', 
  nameLAT: 'Ventriculus sinister',
  description: 'Pompuje krew do krążenia ogólnoustrojowego przez aortę.',
  position: [-0.5, 0, 0.5], 
  structureId: 'serce' 
}
```
