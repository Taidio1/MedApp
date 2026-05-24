# Left Panel Redesign — Spec

**Date:** 2026-05-24  
**Branch:** codex/admin-annotation-editor  
**Scope:** `lib/anatomyData.ts`, `components/PanelLeft/PanelLeft.tsx`, `app/globals.css`

---

## Problem

Lewy panel ma trzy niezależne problemy:

1. `anatomyTree` jest hardkodowane w `lib/anatomyData.ts` — dodanie modelu do bazy danych nie pojawia się w drzewie automatycznie.
2. Panel nie reaguje na aktywny tryb nauki (`points` / `study` / `quiz`) — zawsze wygląda tak samo.
3. Liście drzewa nie pokazują żadnej informacji o annotacjach (liczba, trudność, postęp).

---

## Architektura

### 1. Dynamiczne drzewo z API

Zastąpić statyczny `anatomyTree` funkcją `buildAnatomyTree(structures)`, która derywuje drzewo z danych ze store.

**Statyczna konfiguracja systemów** (`SYSTEM_META`) zostaje w `lib/anatomyData.ts`:

```ts
export const SYSTEM_META: Array<{
  systemKey: string   // wartość pola `system` na strukturze, np. "Układ Krążenia"
  label: string       // wyświetlana nazwa
  icon: string        // emoji
  order: number       // kolejność w panelu
}> = [
  { systemKey: 'Układ Krążenia',   label: 'Układ Krążenia',   icon: '♥',  order: 1 },
  { systemKey: 'Układ Oddechowy',  label: 'Układ Oddechowy',  icon: '🫁', order: 2 },
  { systemKey: 'Układ Pokarmowy',  label: 'Układ Pokarmowy',  icon: '🍽', order: 3 },
  { systemKey: 'Układ Moczowy',    label: 'Układ Moczowy',    icon: '🫘', order: 4 },
]
```

**Funkcja `buildAnatomyTree`:**

```ts
export function buildAnatomyTree(
  structures: Record<string, AnatomicalStructure>
): AnatomyNode[]
```

- Grupuje struktury po polu `structure.system`
- Mapuje grupy na węzły depth=0 wg `SYSTEM_META`
- Systemy bez struktury w API są pomijane
- Systemy spoza `SYSTEM_META` trafiają na koniec listy (fallback: brak ikony)

**Stary export `anatomyTree` zostaje usunięty.** `PanelLeft` wywołuje `buildAnatomyTree(structures)` reaktywnie.

---

### 2. Tryby nauki — co panel pokazuje

Panel subskrybuje ze store: `activeLearningTab`, `rememberedAnnotationIds`, `quizScore`, `selectedStructure`.

#### Liść (organ) — badge zamiast gwiazdki ★

| Tab aktywny | Badge na karcie organu |
|---|---|
| `points` | `"N pkt"` — łączna liczba annotacji (visible = true) |
| `study` | `"X/N"` — zapamiętane/wszystkie, mini pasek postępu |
| `quiz` | `"X/N"` — poprawne/odpowiedzi (tylko dla wybranej struktury), lub `"N pkt"` dla pozostałych |

#### Kropki trudności

Pod nazwą organu — trzy kolorowe kropki dla basic / intermediate / exam, widoczne gdy organ ma annotacje w danym poziomie. Widoczne we wszystkich trybach.

- basic → zielona kropka
- intermediate → żółta kropka  
- exam → czerwona kropka

#### Sekcja "Praca z modelem" → Kontekstowe podsumowanie

Zamiast statycznego tekstu, dynamiczny summary zależny od trybu i wybranej struktury:

- **Brak wybranej struktury (każdy tryb):** "Wybierz strukturę z listy powyżej."
- **`points` + wybrany organ:** "Serce · 12 punktów anatomicznych"
- **`study` + wybrany organ:** "Zapamiętałeś 3 z 12 punktów. Kontynuuj naukę poniżej."
- **`quiz` + wybrany organ:** "Wynik quizu: 5/7 poprawnych · seria 3 ✓"

---

### 3. Szczegóły implementacji

#### `lib/anatomyData.ts`

- Usunąć `anatomyTree` i `baseAnatomyTree`
- Dodać `SYSTEM_META` (tablica z konfiguracją systemów)
- Dodać `buildAnatomyTree(structures)` — pure function, bez side effects

#### `components/PanelLeft/PanelLeft.tsx`

- `PanelLeft` pobiera `structures`, `activeLearningTab`, `rememberedAnnotationIds`, `quizScore` ze store
- Wywołuje `buildAnatomyTree(structures)` wewnątrz komponentu (reaktywnie)
- `TreeNode` otrzymuje props: `node`, `depth`, `learningTab`, `rememberedIds`, `quizScore`
- Logika badge jest w pomocniczej funkcji `getStructureBadge(structure, tab, rememberedIds, quizScore)`
- `rememberedAnnotationIds` zawiera IDs z wszystkich struktur — per-organ filtrujemy: `structure.annotations.filter(a => rememberedIds.includes(a.id)).length`

#### `app/globals.css`

- `.structure-badge` — pill z liczbą (szary tło, małe pismo)
- `.difficulty-dots` — flex row z trzema kółkami (zielony/żółty/czerwony)
- `.study-progress` — cienki pasek (accent color) zastępujący gwiazdkę w trybie study
- `.context-summary` — tekst podsumowania w drugiej sekcji panelu

---

## Dane wejściowe i granice

- Struktury bez annotacji: badge pokazuje `"0 pkt"`, brak kropek trudności
- Struktury spoza `SYSTEM_META.systemKey`: trafiają do sekcji "Inne" na końcu drzewa
- `quizScore` jest globalny (nie per-struktura) — w trybie quiz badge per-organ pokazuje `"N pkt"`, pełny score tylko dla wybranej struktury w sekcji summary

---

## Pliki do zmiany

| Plik | Rodzaj zmiany |
|---|---|
| `lib/anatomyData.ts` | Refactor: usunąć static tree, dodać SYSTEM_META + buildAnatomyTree |
| `components/PanelLeft/PanelLeft.tsx` | Feature: dynamiczne drzewo, logika trybów, progress badges |
| `app/globals.css` | Style: badge, difficulty dots, progress bar, context summary |

**Pliki NIE zmieniane:** `lib/types.ts`, `lib/store.ts`, `lib/learning.ts` — brak potrzeby.

---

## Sukces

- Dodanie nowej struktury do bazy Supabase automatycznie pojawia się w drzewie (bez zmiany kodu)
- W trybie `study` widać postęp zapamiętywania na każdej karcie organu
- W trybie `quiz` sekcja summary pokazuje aktualny wynik i serię
- Trudność annotacji widoczna jako kolorowe kropki na karcie każdego organu
