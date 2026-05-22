# Spec: Migracja danych mockowych do Supabase

**Data:** 2026-05-22  
**Zakres:** Opcja B — pełna migracja struktur anatomicznych i adnotacji do Supabase, drzewo nawigacji pozostaje w TypeScript.

---

## Problem

Dane anatomiczne i adnotacje są przechowywane statycznie:

- `lib/anatomyData.ts` — zahardkodowane struktury anatomiczne (`baseStructures`) z opisami, notatkami biologicznymi, warstwami i adnotacjami bazowymi
- `data/annotations.json` — adnotacje edytowane przez admina, czytane przez `lib/annotationStore.ts` przy imporcie
- `app/api/admin/annotations/route.ts` — zapisuje zmiany admina do pliku JSON na dysku

To blokuje produkcję: dane nie są edytowalne bez deployu, zapis do pliku nie działa w środowiskach read-only (Docker, Vercel), brak kontroli dostępu na poziomie danych.

---

## Cel

Przenieść struktury anatomiczne i adnotacje do Supabase (schema v0.2 jest już zaaplikowana). Usunąć statyczne pliki danych. Aplikacja zachowuje identyczny interfejs dla użytkownika.

---

## Architektura

```
Dziś:
  lib/anatomyData.ts ──────────────────────────► PanelLeft (statyczny import)
  lib/annotationStore.ts (czyta annotations.json)

Po migracji:
  Supabase
  ├── anatomy_structures + anatomy_layers ──► GET /api/structures ──► Zustand store ──► PanelLeft
  └── annotations ──────────────────────────►      (zagnieżdżone w tym samym endpoincie)

  Admin panel:
  AdminAnnotationEditor ──► PUT /api/admin/annotations ──► Supabase annotations
```

### Co zostaje, co znika, co powstaje

| Plik | Los |
|------|-----|
| `lib/anatomyData.ts` | Zostaje — **tylko `baseAnatomyTree` + `anatomyTree`**, usuwamy `baseStructures` |
| `lib/annotationStore.ts` | **Usuwany** |
| `data/annotations.json` | **Usuwany** |
| `app/api/structures/route.ts` | **Nowy** — publiczny GET, zwraca struktury z Supabase |
| `lib/supabase/structures.ts` | **Nowy** — warstwa dostępu do danych |
| `lib/store.ts` | Rozszerzony o `structures`, `structuresLoading`, `loadStructures` |
| `components/PanelLeft/PanelLeft.tsx` | Import `structures` z `useAppStore` zamiast `anatomyData` |
| `app/api/admin/annotations/route.ts` | **Przepisany** — z pliku JSON na Supabase |

---

## API Layer

### `GET /api/structures` (nowy, publiczny)

Zwraca wszystkie opublikowane struktury z warstwami i adnotacjami. Używa `createSupabaseServerClient` z anonowym kluczem — RLS filtruje `is_published = true` i `is_premium = false` dla anonowych.

Kształt odpowiedzi: `Record<string, AnatomicalStructure>` — identyczny z obecnym eksportem `structures` z `anatomyData.ts`.

Mapowanie kolumn DB → TypeScript:

| DB (snake_case) | TypeScript (camelCase) |
|-----------------|----------------------|
| `anatomy_structures.name_pl` | `namePL` |
| `anatomy_structures.biological_notes` | `biologicalNotes` |
| `anatomy_layers.layer_key` | `id` (mesh name w GLB) |
| `anatomy_layers.default_visible` | `defaultVisible` |
| `annotations.annotation_key` | `id` |
| `annotations.name_lat` | `nameLAT` |
| `annotations.position` (double[]) | `[number, number, number]` |

### `GET /api/admin/annotations` (przepisany)

Zwraca `{ structures, annotations }` — identyczny kształt jak dziś. Backend zmienia się z `readFile(annotations.json)` na `supabase.from('annotations').select('*')`.

### `PUT /api/admin/annotations` (przepisany)

Przyjmuje `{ structureId, annotations[] }` — identyczny interfejs jak dziś. Backend:
1. `DELETE` wszystkich adnotacji dla danej struktury
2. `INSERT` nowej listy

Strategia delete+insert jest prostsza niż diff i bezpieczna bo admin zawsze wysyła pełną listę dla jednej struktury naraz.

Auth: bez zmian — `rejectNonAdmin()` przez `getCurrentUserProfile()`.

---

## State Management

`lib/store.ts` otrzymuje trzy nowe pola:

```typescript
structures: Record<string, AnatomicalStructure>  // pusty obiekt na starcie
structuresLoading: boolean                        // true podczas fetch
loadStructures: () => Promise<void>               // wywołuje GET /api/structures
```

`loadStructures()` wywoływane przy montowaniu aplikacji (w `app/page.tsx` przez `useEffect`). Po załadowaniu struktury są dostępne globalnie — nie ma potrzeby re-fetchowania przy nawigacji.

`PanelLeft` czyta `structures` i `structuresLoading` z `useAppStore()`. Podczas ładowania wyświetla spinner zamiast drzewa. Po załadowaniu — zachowanie identyczne jak dziś.

---

## Warstwa dostępu do danych

Nowy plik `lib/supabase/structures.ts` eksportuje:

```typescript
fetchStructures(supabase): Promise<Record<string, AnatomicalStructure>>
```

Jedno zapytanie z Supabase JS client używając `.select()` z zagnieżdżonymi relacjami (`anatomy_layers`, `annotations`). Mapuje wynik na `Record<string, AnatomicalStructure>`.

---

## Cleanup

| Akcja | Co |
|-------|----|
| Usuń plik | `data/annotations.json` |
| Usuń plik | `lib/annotationStore.ts` |
| Usuń z `lib/anatomyData.ts` | `baseStructures`, importy `annotationStore`, funkcje `mergeStructuresWithAnnotationStore` / `getAnnotationStoreForClient` |
| Usuń import w `PanelLeft` | `structures` z `@/lib/anatomyData` |
| Usuń w `admin/annotations/route.ts` | importy `fs/promises`, `annotationStore`, logika pliku |

---

## Poza zakresem

- Drzewo nawigacji (`anatomyTree`) — pozostaje w TypeScript jako konfiguracja UI
- RAG / knowledge_documents / chat_sessions — osobne migracje
- Panel admina do zarządzania strukturami (dodawanie/edycja przez UI) — osobna praca
- Migracja danych struktury z TypeScript do Supabase — schema v0.2 ma już seed z aktualnymi danymi
