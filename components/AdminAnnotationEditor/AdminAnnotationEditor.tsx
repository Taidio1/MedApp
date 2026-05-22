'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Annotation } from '@/lib/types'
const ANNOTATION_SIZE_MIN = 0.02
const ANNOTATION_SIZE_MAX = 0.25
const ANNOTATION_SIZE_DEFAULT = 0.08

interface AnnotationStoreRecord {
  id: string
  label: string
  nameLAT?: string
  description?: string
  position: [number, number, number]
  size?: number
  visible?: boolean
}
import {
  AdminAnnotationCanvas,
  AdminAnnotationCanvasHandle,
  EditorMode,
} from './AdminAnnotationCanvas'

interface AdminStructureSummary {
  id: string
  namePL: string
  nameLAT: string
  system: string
  hasLayers: boolean
}

type AnnotationStorePayload = Record<string, AnnotationStoreRecord[]>

interface AdminPayload {
  structures: AdminStructureSummary[]
  annotations: AnnotationStorePayload
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const modes: { id: EditorMode; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'add', label: 'Add' },
  { id: 'move', label: 'Move' },
  { id: 'preview', label: 'Preview' },
]

function annotationToRuntime(
  structureId: string,
  annotation: AnnotationStoreRecord,
): Annotation {
  return { ...annotation, structureId }
}

function annotationToStore(annotation: Annotation): AnnotationStoreRecord {
  return {
    id: annotation.id,
    label: annotation.label,
    nameLAT: annotation.nameLAT,
    description: annotation.description,
    position: annotation.position,
    size: annotation.size,
    visible: annotation.visible,
  }
}

function makeAnnotationId(structureId: string, annotations: Annotation[]) {
  let index = annotations.length + 1
  let id = `ann-${structureId}-${index}`

  while (annotations.some((annotation) => annotation.id === id)) {
    index += 1
    id = `ann-${structureId}-${index}`
  }

  return id
}

export function AdminAnnotationEditor() {
  const [structures, setStructures] = useState<AdminStructureSummary[]>([])
  const [annotationStore, setAnnotationStore] = useState<AnnotationStorePayload>({})
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [mode, setMode] = useState<EditorMode>('select')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [snapStep, setSnapStep] = useState(0.05)
  type SuggestState = 'idle' | 'loading' | 'done' | 'error'
  const [suggestState, setSuggestState] = useState<SuggestState>('idle')
  const canvasRef = useRef<AdminAnnotationCanvasHandle>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/admin/annotations')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error ?? 'Nie udało się wczytać anotacji')
        }

        if (!alive) return

        const payload = data as AdminPayload
        setStructures(payload.structures)
        setAnnotationStore(payload.annotations)
        setSelectedStructureId(payload.structures[0]?.id ?? null)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : 'Nieznany błąd')
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  const selectedStructure = structures.find(
    (structure) => structure.id === selectedStructureId,
  )
  const annotations = useMemo(() => {
    if (!selectedStructureId) return []
    return (annotationStore[selectedStructureId] ?? []).map((annotation) =>
      annotationToRuntime(selectedStructureId, annotation),
    )
  }, [annotationStore, selectedStructureId])
  const selectedAnnotation =
    annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null

  useEffect(() => {
    if (!selectedAnnotationId && annotations.length > 0) {
      setSelectedAnnotationId(annotations[0].id)
      return
    }

    if (
      selectedAnnotationId &&
      !annotations.some((annotation) => annotation.id === selectedAnnotationId)
    ) {
      setSelectedAnnotationId(annotations[0]?.id ?? null)
    }
  }, [annotations, selectedAnnotationId])

  const persistAnnotations = async (
    structureId: string,
    nextAnnotations: Annotation[],
  ) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }

    setSaveState('saving')
    setError(null)

    try {
      const response = await fetch('/api/admin/annotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structureId,
          annotations: nextAnnotations.map(annotationToStore),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Nie udało się zapisać anotacji')
      }

      setAnnotationStore((current) => ({
        ...current,
        [structureId]: data.annotations,
      }))
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('error')
      setError(saveError instanceof Error ? saveError.message : 'Nieznany błąd zapisu')
    }
  }

  const schedulePersist = (
    structureId: string,
    nextAnnotations: Annotation[],
    delay = 450,
  ) => {
    setAnnotationStore((current) => ({
      ...current,
      [structureId]: nextAnnotations.map(annotationToStore),
    }))
    setSaveState('dirty')

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      persistAnnotations(structureId, nextAnnotations)
    }, delay)
  }

  const updateSelectedStructureAnnotations = (
    updater: (annotations: Annotation[]) => Annotation[],
    delay?: number,
  ) => {
    if (!selectedStructureId) return
    schedulePersist(selectedStructureId, updater(annotations), delay)
  }

  const addAnnotation = (position: [number, number, number]) => {
    if (!selectedStructureId) return

    const annotation: Annotation = {
      id: makeAnnotationId(selectedStructureId, annotations),
      label: 'Nowy punkt',
      nameLAT: '',
      description: '',
      position,
      size: ANNOTATION_SIZE_DEFAULT,
      visible: true,
      structureId: selectedStructureId,
    }

    const nextAnnotations = [...annotations, annotation]
    setSelectedAnnotationId(annotation.id)
    setMode('select')
    schedulePersist(selectedStructureId, nextAnnotations, 0)
  }

  const duplicateAnnotation = () => {
    if (!selectedStructureId || !selectedAnnotation) return

    const duplicate: Annotation = {
      ...selectedAnnotation,
      id: makeAnnotationId(selectedStructureId, annotations),
      label: `${selectedAnnotation.label} kopia`,
      position: [
        Number((selectedAnnotation.position[0] + 0.08).toFixed(3)),
        selectedAnnotation.position[1],
        selectedAnnotation.position[2],
      ],
    }
    const nextAnnotations = [...annotations, duplicate]
    setSelectedAnnotationId(duplicate.id)
    schedulePersist(selectedStructureId, nextAnnotations, 0)
  }

  const deleteSelectedAnnotation = () => {
    if (!selectedStructureId || !selectedAnnotation) return

    const nextAnnotations = annotations.filter(
      (annotation) => annotation.id !== selectedAnnotation.id,
    )
    setSelectedAnnotationId(nextAnnotations[0]?.id ?? null)
    schedulePersist(selectedStructureId, nextAnnotations, 0)
  }

  const patchAnnotation = (id: string, patch: Partial<Annotation>, delay?: number) => {
    updateSelectedStructureAnnotations(
      (current) =>
        current.map((annotation) =>
          annotation.id === id ? { ...annotation, ...patch } : annotation,
        ),
      delay,
    )
  }

  const flushSave = () => {
    if (!selectedStructureId) return
    persistAnnotations(selectedStructureId, annotations)
  }

  const suggestPosition = async () => {
    if (!selectedAnnotation || !canvasRef.current || !selectedStructure) return
    setSuggestState('loading')
    setError(null)
    try {
      const images = await canvasRef.current.captureViews()
      const response = await fetch('/api/admin/suggest-annotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structureId: selectedStructureId,
          structureNamePL: selectedStructure.namePL,
          annotationLabel: selectedAnnotation.label,
          images,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Błąd AI')
      patchAnnotation(selectedAnnotation.id, { position: data.position }, 0)
      setSuggestState('done')
      window.setTimeout(() => setSuggestState('idle'), 2200)
    } catch (suggestError) {
      setSuggestState('error')
      setError(suggestError instanceof Error ? suggestError.message : 'Nieznany błąd AI')
    }
  }

  const modelUrl = selectedStructureId ? `/models/${selectedStructureId}.glb` : null

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#101827] text-slate-300">
        Ładowanie edytora anotacji...
      </main>
    )
  }

  return (
    <main className="grid h-screen grid-rows-[44px_1fr] overflow-hidden bg-[#101827] text-slate-100">
      <header className="flex items-center gap-4 border-b border-[#26364f] bg-[#0f172a] px-5">
        <div className="text-sm font-semibold">Admin Annotations</div>
        <div className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
          development only
        </div>
        <div className="ml-auto text-[11px] text-slate-400">
          {saveState === 'idle' && 'Bez zmian'}
          {saveState === 'dirty' && 'Oczekuje na zapis...'}
          {saveState === 'saving' && 'Zapisuję...'}
          {saveState === 'saved' && 'Zapisano'}
          {saveState === 'error' && 'Błąd zapisu'}
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-[280px_minmax(360px,1fr)_340px]">
        <aside className="flex min-h-0 flex-col border-r border-[#26364f] bg-[#111d2d]">
          <div className="border-b border-[#26364f] p-3">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Struktura
            </label>
            <select
              value={selectedStructureId ?? ''}
              onChange={(event) => {
                setSelectedStructureId(event.target.value)
                setSelectedAnnotationId(null)
              }}
              className="w-full rounded border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#fbbf24]"
            >
              {structures.map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.namePL}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border-b border-[#26364f] p-3">
            <button
              onClick={() => addAnnotation([0, 0, 0])}
              disabled={!selectedStructureId}
              className="rounded bg-[#fbbf24] px-3 py-1.5 text-xs font-semibold text-[#111827] disabled:opacity-40"
            >
              Dodaj
            </button>
            <button
              onClick={duplicateAnnotation}
              disabled={!selectedAnnotation}
              className="rounded border border-[#334155] px-3 py-1.5 text-xs text-slate-200 disabled:opacity-40"
            >
              Duplikuj
            </button>
            <button
              onClick={deleteSelectedAnnotation}
              disabled={!selectedAnnotation}
              className="rounded border border-red-400/40 px-3 py-1.5 text-xs text-red-200 disabled:opacity-40"
            >
              Usuń
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {annotations.length === 0 ? (
              <p className="p-3 text-xs leading-relaxed text-slate-500">
                Brak punktów dla tej struktury. Użyj Add i kliknij model albo dodaj punkt
                domyślny.
              </p>
            ) : (
              annotations.map((annotation) => (
                <button
                  key={annotation.id}
                  onClick={() => setSelectedAnnotationId(annotation.id)}
                  className={[
                    'mb-1 w-full rounded px-3 py-2 text-left text-xs transition',
                    annotation.id === selectedAnnotationId
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-[#17243a] text-slate-300 hover:bg-[#21314d]',
                    annotation.visible === false ? 'opacity-55' : '',
                  ].join(' ')}
                >
                  <span className="block truncate font-semibold">{annotation.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] opacity-65">
                    {annotation.id}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="grid min-h-0 grid-rows-[42px_1fr]">
          <div className="flex items-center gap-2 border-b border-[#26364f] bg-[#0f172a] px-4">
            {modes.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                className={[
                  'rounded px-3 py-1.5 text-xs font-medium transition',
                  mode === item.id
                    ? 'bg-[#fbbf24] text-[#111827]'
                    : 'border border-[#334155] text-slate-300 hover:border-slate-400',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#fbbf24]"
                />
                Snap
              </label>
              {snapEnabled && (
                <input
                  type="number"
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  value={snapStep}
                  onChange={(e) => setSnapStep(Number(e.target.value))}
                  className="w-16 rounded border border-[#334155] bg-[#0f172a] px-2 py-1 text-xs text-slate-100 outline-none focus:border-[#fbbf24]"
                />
              )}
              {message && <span className="text-[11px] text-amber-200">{message}</span>}
            </div>
          </div>

          <AdminAnnotationCanvas
            ref={canvasRef}
            annotations={annotations}
            mode={mode}
            modelUrl={modelUrl}
            selectedAnnotationId={selectedAnnotationId}
            onAddAnnotation={addAnnotation}
            onMoveAnnotation={(id, position) => patchAnnotation(id, { position }, 250)}
            onSelectAnnotation={setSelectedAnnotationId}
            onMessage={(nextMessage) => {
              setMessage(nextMessage)
              window.setTimeout(() => setMessage(null), 2200)
            }}
            snapEnabled={snapEnabled}
            snapStep={snapStep}
          />
        </section>

        <aside className="min-h-0 overflow-y-auto border-l border-[#d7d0c3] bg-[#f6f1e8] p-4 text-[#172033]">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c3aed]">
              Inspektor
            </p>
            <h1 className="mt-1 text-lg font-bold leading-tight">
              {selectedStructure?.namePL ?? 'Brak struktury'}
            </h1>
            {selectedStructure && (
              <p className="text-xs italic text-[#6d28d9]">{selectedStructure.nameLAT}</p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
              {error}
            </div>
          )}

          {!selectedAnnotation ? (
            <p className="rounded border border-dashed border-[#c9c0b1] p-4 text-sm text-[#766b5f]">
              Wybierz punkt z listy albo dodaj nowy na modelu.
            </p>
          ) : (
            <div className="space-y-4">
              <Field label="ID">
                <input
                  value={selectedAnnotation.id}
                  readOnly
                  className="w-full rounded border border-[#d8d0c3] bg-white/60 px-3 py-2 text-xs text-[#766b5f]"
                />
              </Field>
              <Field label="Nazwa PL">
                <input
                  value={selectedAnnotation.label}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, { label: event.target.value })
                  }
                  className="w-full rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
                />
              </Field>
              <Field label="Łacina">
                <input
                  value={selectedAnnotation.nameLAT ?? ''}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, { nameLAT: event.target.value })
                  }
                  className="w-full rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#7c3aed]"
                />
              </Field>
              <Field label="Opis">
                <textarea
                  value={selectedAnnotation.description ?? ''}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      description: event.target.value,
                    })
                  }
                  rows={5}
                  className="w-full resize-none rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#7c3aed]"
                />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                {(['x', 'y', 'z'] as const).map((axis, index) => (
                  <Field key={axis} label={axis.toUpperCase()}>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedAnnotation.position[index]}
                      onChange={(event) => {
                        const position = [...selectedAnnotation.position] as [
                          number,
                          number,
                          number,
                        ]
                        position[index] = Number(event.target.value)
                        patchAnnotation(selectedAnnotation.id, { position })
                      }}
                      className="w-full rounded border border-[#d8d0c3] bg-white px-2 py-2 text-sm outline-none focus:border-[#7c3aed]"
                    />
                  </Field>
                ))}
              </div>
              <p className="text-[11px] text-[#8a8174]">
                r ={' '}
                {Math.sqrt(
                  selectedAnnotation.position[0] ** 2 +
                  selectedAnnotation.position[1] ** 2 +
                  selectedAnnotation.position[2] ** 2,
                ).toFixed(3)}
                {' '}(odległość od centrum)
              </p>

              <Field label={`Rozmiar (${selectedAnnotation.size ?? ANNOTATION_SIZE_DEFAULT})`}>
                <input
                  type="range"
                  min={ANNOTATION_SIZE_MIN}
                  max={ANNOTATION_SIZE_MAX}
                  step="0.01"
                  value={selectedAnnotation.size ?? ANNOTATION_SIZE_DEFAULT}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      size: Number(event.target.value),
                    })
                  }
                  className="w-full accent-[#7c3aed]"
                />
              </Field>

              <label className="flex items-center justify-between rounded border border-[#d8d0c3] bg-white px-3 py-2 text-sm">
                Widoczny punkt
                <input
                  type="checkbox"
                  checked={selectedAnnotation.visible !== false}
                  onChange={(event) =>
                    patchAnnotation(selectedAnnotation.id, {
                      visible: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#7c3aed]"
                />
              </label>

              {selectedAnnotation.label.trim() !== '' && (
                <button
                  onClick={suggestPosition}
                  disabled={suggestState === 'loading'}
                  className="w-full rounded border border-[#7c3aed]/50 px-3 py-2 text-sm font-semibold text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/10 disabled:opacity-40"
                >
                  {suggestState === 'loading'
                    ? 'Pytam AI…'
                    : suggestState === 'done'
                      ? 'Pozycja zaktualizowana'
                      : 'Zasugeruj pozycję'}
                </button>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={flushSave}
                  className="flex-1 rounded bg-[#7c3aed] px-3 py-2 text-sm font-semibold text-white"
                >
                  Zapisz teraz
                </button>
                <button
                  onClick={deleteSelectedAnnotation}
                  className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"
                >
                  Usuń
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#8a8174]">
        {label}
      </span>
      {children}
    </label>
  )
}
