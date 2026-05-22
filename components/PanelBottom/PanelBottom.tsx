'use client'

import { useAppStore } from '@/lib/store'

function EmptyLearningPanel() {
  return (
    <div className="flex h-full flex-1 items-center justify-center px-6 text-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
          Mapa nauki
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#6b7280]">
          Po wybraniu narządu pojawią się tutaj punkty orientacyjne i szybka powtórka.
        </p>
      </div>
    </div>
  )
}

function LearningMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="min-w-[92px] rounded-md border border-[#e5e7eb] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-semibold text-[#111827]">
        {value}
      </div>
    </div>
  )
}

export function PanelBottom() {
  const selectedStructure = useAppStore((state) => state.selectedStructure)
  const activeAnnotation = useAppStore((state) => state.activeAnnotation)
  const setActiveAnnotation = useAppStore((state) => state.setActiveAnnotation)
  const annotations = selectedStructure?.annotations ?? []
  const visibleAnnotations = annotations.slice(0, 4)
  const activeAnnotationInStructure =
    activeAnnotation?.structureId === selectedStructure?.id ? activeAnnotation : null

  return (
    <section className="flex h-[120px] flex-shrink-0 items-stretch overflow-hidden border-t border-[#e5e7eb] bg-[#f5f0e8]">
      {!selectedStructure ? (
        <EmptyLearningPanel />
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col px-5 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  Punkty orientacyjne
                </p>
                <p className="mt-0.5 text-[11px] text-[#6b7280]">
                  {selectedStructure.namePL} · {selectedStructure.nameLAT}
                </p>
              </div>
              <span className="rounded-full bg-[#ede9fe] px-2.5 py-1 text-[10px] font-semibold text-[#6d28d9]">
                {annotations.length} anotacje
              </span>
            </div>

            {visibleAnnotations.length > 0 ? (
              <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
                {visibleAnnotations.map((annotation, index) => {
                  const isActive = activeAnnotationInStructure?.id === annotation.id

                  return (
                    <button
                      key={annotation.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveAnnotation(annotation)}
                      className={[
                        'group min-w-0 rounded-md border px-3 py-2 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200',
                        'hover:-translate-y-0.5 hover:border-[#7c3aed]/45 hover:shadow-[0_8px_22px_rgba(124,58,237,0.14)]',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]',
                        isActive
                          ? 'border-[#7c3aed] bg-[#f4f0ff] shadow-[0_10px_28px_rgba(124,58,237,0.18)]'
                          : 'border-[#e5e7eb] bg-white',
                      ].join(' ')}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={[
                            'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform duration-200',
                            isActive ? 'scale-110 bg-[#f59e0b]' : 'bg-[#7c3aed] group-hover:scale-105',
                          ].join(' ')}
                        >
                          {index + 1}
                        </span>
                        <span className="truncate text-xs font-semibold text-[#111827]">
                          {annotation.label}
                        </span>
                      </div>
                      <p className="truncate text-[10px] italic text-[#7c3aed]">
                        {annotation.nameLAT ?? 'Nazwa łacińska w opracowaniu'}
                      </p>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-1 items-center rounded-md border border-dashed border-[#d1d5db] px-4 text-xs text-[#9ca3af]">
                Ten model nie ma jeszcze oznaczonych punktów nauki.
              </div>
            )}
          </div>

          <div className="flex w-[300px] flex-shrink-0 flex-col gap-2 border-l border-[#e5e7eb] px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              Szybka powtórka
            </p>
            <div className="grid grid-cols-2 gap-2">
              <LearningMetric label="Układ" value={selectedStructure.system} />
              <LearningMetric label="Model" value=".glb" />
            </div>
            <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6b7280]">
              {activeAnnotationInStructure?.description ??
                annotations[0]?.description ??
                selectedStructure.description}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
