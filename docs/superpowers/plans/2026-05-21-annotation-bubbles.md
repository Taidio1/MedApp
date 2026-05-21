# Annotation Bubbles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodanie bogatych dymków hover (nazwa PL + łacina + opis) do punktów adnotacji w przeglądarce 3D.

**Architecture:** Rozszerzamy interfejs `Annotation` o dwa opcjonalne pola (`nameLAT`, `description`), a następnie aktualizujemy komponent `AnnotationPoint` tak, by renderował wzbogacony dymek HTML przez `<Html>` z @react-three/drei. Wsteczna kompatybilność — adnotacje bez nowych pól działają jak dotychczas.

**Tech Stack:** TypeScript, React, @react-three/drei (`Html`), Next.js 16

---

### Task 1: Rozszerzenie interfejsu `Annotation`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Krok 1: Dodaj pola do interfejsu `Annotation`**

Otwórz `lib/types.ts`. Znajdź interfejs `Annotation` (linie 4–10) i dodaj dwa opcjonalne pola między `label` a `position`:

```typescript
/** Punkt anotacji w przestrzeni 3D */
export interface Annotation {
  id: string
  label: string
  nameLAT?: string
  description?: string
  /** Pozycja XYZ w przestrzeni Three.js */
  position: [number, number, number]
  structureId: string
}
```

- [ ] **Krok 2: Sprawdź kompilację TypeScript**

```bash
npx tsc --noEmit
```

Oczekiwany wynik: brak błędów (pola są opcjonalne — istniejące adnotacje w `anatomyData.ts` nie wymagają zmian).

- [ ] **Krok 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add nameLAT and description fields to Annotation type"
```

---

### Task 2: Wzbogacony dymek hover w `AnnotationPoint`

**Files:**
- Modify: `components/Viewer3D/Annotations.tsx`

- [ ] **Krok 1: Zastąp istniejący tooltip nowym dymkiem**

Otwórz `components/Viewer3D/Annotations.tsx`. Zastąp cały blok `{hovered && (...)}` (linie 38–55) nowym kodem:

```tsx
{hovered && (
  <Html distanceFactor={10} zIndexRange={[100, 0]}>
    <div
      style={{
        background: '#1e1b4b',
        border: '1px solid #7c3aed',
        borderRadius: '10px',
        padding: '10px 14px',
        maxWidth: '220px',
        whiteSpace: 'normal',
        pointerEvents: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        position: 'relative',
      }}
    >
      {/* Nazwa PL */}
      <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '13px' }}>
        {annotation.label}
      </div>

      {/* Nazwa łacińska */}
      {annotation.nameLAT && (
        <div style={{ fontStyle: 'italic', color: '#818cf8', fontSize: '10px', marginTop: '2px' }}>
          {annotation.nameLAT}
        </div>
      )}

      {/* Separator */}
      {(annotation.nameLAT || annotation.description) && (
        <hr style={{ border: 'none', borderTop: '1px solid #2d1b69', margin: '6px 0' }} />
      )}

      {/* Opis */}
      {annotation.description && (
        <div style={{ color: '#c4b5fd', fontSize: '11px', lineHeight: '1.5' }}>
          {annotation.description}
        </div>
      )}

      {/* Strzałka wskazująca na punkt */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '6px solid #7c3aed',
        }}
      />
    </div>
  </Html>
)}
```

- [ ] **Krok 2: Sprawdź kompilację TypeScript**

```bash
npx tsc --noEmit
```

Oczekiwany wynik: brak błędów.

- [ ] **Krok 3: Uruchom dev server i sprawdź wizualnie**

```bash
npm run dev
```

Otwórz http://localhost:3000. Wybierz strukturę z adnotacjami (np. **Serce**). Najedź kursorem na żółty punkt — powinien pojawić się dymek z samą nazwą (bo brak `nameLAT`/`description` w istniejących danych).

Oczekiwany wynik: dymek ciemnofioletowy z fioletową ramką, pokazuje tylko `label`.

- [ ] **Krok 4: Dodaj testowe dane do jednej adnotacji w `anatomyData.ts`**

W `lib/anatomyData.ts` znajdź adnotację `ann-serce-1` i uzupełnij pola:

```typescript
{ 
  id: 'ann-serce-1', 
  label: 'Komora lewa', 
  nameLAT: 'Ventriculus sinister',
  description: 'Pompuje krew do krążenia ogólnoustrojowego przez aortę. Największa jama serca.',
  position: [-0.5, 0, 0.5], 
  structureId: 'serce' 
},
```

- [ ] **Krok 5: Sprawdź dymek z pełną zawartością**

W przeglądarce (http://localhost:3000) wybierz **Serce** i najedź na punkt „Komora lewa". Sprawdź:
- Nazwa PL: `Komora lewa` — pogrubiona, fioletowa
- Łacina: `Ventriculus sinister` — kursywa, jaśniejszy fiolet
- Separator: pozioma linia
- Opis: pełny tekst zawijający się do 220px
- Strzałka CSS wskazuje w dół na punkt

- [ ] **Krok 6: Cofnij testowe dane (opcjonalnie) lub zostaw**

Możesz zostawić uzupełnione dane dla `ann-serce-1` — to prawidłowe dane anatomiczne.

- [ ] **Krok 7: Commit**

```bash
git add components/Viewer3D/Annotations.tsx lib/anatomyData.ts
git commit -m "feat: add rich hover bubble to annotation points (nameLAT + description)"
```

---

## Jak dodawać dane dla nowych modeli

Po implementacji, aby wypełnić adnotacje dla nowych organów, dodaj je do `lib/anatomyData.ts` według schematu:

```typescript
{ 
  id: 'ann-<organ>-1', 
  label: 'Nazwa polska',
  nameLAT: 'Nomen Latinum',
  description: 'Krótki opis funkcji, 1–2 zdania.',
  position: [x, y, z],   // pozycja w przestrzeni 3D modelu
  structureId: '<organ-id>' 
}
```
