'use client'

import { useEffect, useState } from 'react'
import { NAUKA_SYSTEMS } from '@/lib/naukaData'

// ── Types ──────────────────────────────────────────────────────────────────

interface DbFlashcard {
  id: string
  question: string
  answer: string
  system: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  mnemonic: string
  details: string
  struct: string
}

interface DbSection {
  id: string
  title: string
  content: string
  sort_order: number
}

interface DbReadingMaterialAdmin {
  id: string
  sys: string
  title: string
  read_time: number
  reading_sections: DbSection[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const NK = '#2a7a60'
const CARD_BG = '#fbf7ee'
const CARD_BORDER = 'rgba(91,78,60,0.14)'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'
const SYSTEMS = NAUKA_SYSTEMS.filter(s => s.name !== 'Wszystkie układy').map(s => s.name)

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7,
  border: `1.5px solid ${CARD_BORDER}`, fontFamily: SANS,
  fontSize: 13.5, color: TEXT_MAIN, background: '#fafafa', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 80, resize: 'vertical' }
const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, fontFamily: SANS, fontWeight: 600, padding: '2px 6px',
}

// ── Helpers ────────────────────────────────────────────────────────────────

const blankFC = (): Partial<DbFlashcard> => ({
  id: '', question: '', answer: '', system: SYSTEMS[0],
  difficulty: 'basic', mnemonic: '', details: '', struct: '',
})
const blankMaterial = () => ({ sys: SYSTEMS[0], title: '', read_time: 5 })
const blankSection = () => ({ id: '', title: '', content: '', sort_order: 0 })

// ── Shared UI ──────────────────────────────────────────────────────────────

function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, cursor: 'pointer' }}
    />
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <Overlay onClose={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, padding: 28, width: 520,
        maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        zIndex: 101, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: TEXT_MID }}>×</button>
        </div>
        {children}
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: TEXT_MID, fontFamily: SANS, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'primary' }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'
}) {
  const bg = variant === 'danger' ? '#e05252' : variant === 'ghost' ? 'transparent' : NK
  const color = variant === 'ghost' ? TEXT_MID : '#fff'
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      style={{
        padding: '7px 16px', borderRadius: 7, background: bg, color,
        border: variant === 'ghost' ? `1.5px solid ${CARD_BORDER}` : 'none',
        fontFamily: SANS, fontSize: 13, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{ color: '#c0392b', background: '#fdecea', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13.5 }}>
      {msg}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AdminNaukaPanel() {
  const [tab, setTab] = useState<'flashcards' | 'readings'>('flashcards')

  // Flashcards state
  const [flashcards, setFlashcards] = useState<DbFlashcard[]>([])
  const [loadingFC, setLoadingFC] = useState(false)
  const [errorFC, setErrorFC] = useState<string | null>(null)
  const [fcModal, setFcModal] = useState<'add' | 'edit' | null>(null)
  const [editingFC, setEditingFC] = useState<DbFlashcard | null>(null)
  const [fcForm, setFcForm] = useState<Partial<DbFlashcard>>(blankFC())
  const [savingFC, setSavingFC] = useState(false)
  const [formErrFC, setFormErrFC] = useState<string | null>(null)

  // Readings state
  const [readings, setReadings] = useState<DbReadingMaterialAdmin[]>([])
  const [loadingRM, setLoadingRM] = useState(false)
  const [errorRM, setErrorRM] = useState<string | null>(null)
  const [expandedRM, setExpandedRM] = useState<Set<string>>(new Set())
  const [rmModal, setRmModal] = useState<'add' | 'edit' | null>(null)
  const [editingRM, setEditingRM] = useState<DbReadingMaterialAdmin | null>(null)
  const [rmForm, setRmForm] = useState(blankMaterial())
  const [savingRM, setSavingRM] = useState(false)
  const [formErrRM, setFormErrRM] = useState<string | null>(null)
  const [secModal, setSecModal] = useState<{ materialId: string; mode: 'add' | 'edit' } | null>(null)
  const [editingSec, setEditingSec] = useState<DbSection | null>(null)
  const [secForm, setSecForm] = useState(blankSection())
  const [savingSec, setSavingSec] = useState(false)
  const [formErrSec, setFormErrSec] = useState<string | null>(null)

  async function loadFlashcards() {
    setLoadingFC(true); setErrorFC(null)
    try {
      const res = await fetch('/api/admin/nauka/flashcards')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setFlashcards(await res.json())
    } catch (e) { setErrorFC(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoadingFC(false) }
  }

  async function loadReadings() {
    setLoadingRM(true); setErrorRM(null)
    try {
      const res = await fetch('/api/admin/nauka/readings')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setReadings(await res.json())
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoadingRM(false) }
  }

  useEffect(() => { loadFlashcards() }, [])
  useEffect(() => { if (tab === 'readings') loadReadings() }, [tab])

  // ── Flashcard CRUD ──

  function openAddFC() { setEditingFC(null); setFcForm(blankFC()); setFormErrFC(null); setFcModal('add') }
  function openEditFC(fc: DbFlashcard) { setEditingFC(fc); setFcForm({ ...fc }); setFormErrFC(null); setFcModal('edit') }

  async function saveFC() {
    if (!fcForm.id?.trim() || !fcForm.question?.trim() || !fcForm.answer?.trim()) {
      setFormErrFC('Pola id, pytanie i odpowiedź są wymagane'); return
    }
    setSavingFC(true); setFormErrFC(null)
    try {
      const url = fcModal === 'edit' ? `/api/admin/nauka/flashcards/${editingFC!.id}` : '/api/admin/nauka/flashcards'
      const res = await fetch(url, {
        method: fcModal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fcForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setFcModal(null); await loadFlashcards()
    } catch (e) { setFormErrFC(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingFC(false) }
  }

  async function deleteFC(id: string) {
    if (!window.confirm('Usunąć tę fiszkę?')) return
    try {
      const res = await fetch(`/api/admin/nauka/flashcards/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadFlashcards()
    } catch (e) { setErrorFC(e instanceof Error ? e.message : 'Błąd') }
  }

  // ── Reading CRUD ──

  function openAddRM() { setEditingRM(null); setRmForm(blankMaterial()); setFormErrRM(null); setRmModal('add') }
  function openEditRM(rm: DbReadingMaterialAdmin) {
    setEditingRM(rm); setRmForm({ sys: rm.sys, title: rm.title, read_time: rm.read_time })
    setFormErrRM(null); setRmModal('edit')
  }

  async function saveRM() {
    if (!rmForm.title.trim()) { setFormErrRM('Tytuł jest wymagany'); return }
    setSavingRM(true); setFormErrRM(null)
    try {
      const url = rmModal === 'edit' ? `/api/admin/nauka/readings/${editingRM!.id}` : '/api/admin/nauka/readings'
      const res = await fetch(url, {
        method: rmModal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rmForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setRmModal(null); await loadReadings()
    } catch (e) { setFormErrRM(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingRM(false) }
  }

  async function deleteRM(id: string) {
    if (!window.confirm('Usunąć ten materiał i wszystkie jego sekcje?')) return
    try {
      const res = await fetch(`/api/admin/nauka/readings/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadReadings()
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
  }

  function toggleExpandRM(id: string) {
    setExpandedRM(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Section CRUD ──

  function openAddSec(materialId: string) {
    setEditingSec(null); setSecForm(blankSection()); setFormErrSec(null)
    setSecModal({ materialId, mode: 'add' })
  }
  function openEditSec(materialId: string, sec: DbSection) {
    setEditingSec(sec)
    setSecForm({ id: sec.id, title: sec.title, content: sec.content, sort_order: sec.sort_order })
    setFormErrSec(null); setSecModal({ materialId, mode: 'edit' })
  }

  async function saveSec() {
    if (!secForm.id.trim() || !secForm.title.trim() || !secForm.content.trim()) {
      setFormErrSec('Pola id, tytuł i treść są wymagane'); return
    }
    setSavingSec(true); setFormErrSec(null)
    const { materialId, mode } = secModal!
    try {
      const url = mode === 'edit'
        ? `/api/admin/nauka/readings/${materialId}/sections/${editingSec!.id}`
        : `/api/admin/nauka/readings/${materialId}/sections`
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secForm),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setSecModal(null); await loadReadings()
    } catch (e) { setFormErrSec(e instanceof Error ? e.message : 'Błąd') }
    finally { setSavingSec(false) }
  }

  async function deleteSec(materialId: string, sectionId: string) {
    if (!window.confirm('Usunąć tę sekcję?')) return
    try {
      const res = await fetch(`/api/admin/nauka/readings/${materialId}/sections/${sectionId}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadReadings()
    } catch (e) { setErrorRM(e instanceof Error ? e.message : 'Błąd') }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', fontFamily: SANS }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT_MAIN, margin: '0 0 8px' }}>
        Nauka — Panel admina
      </h1>
      <a href="/admin" style={{ fontSize: 13, color: NK, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
        ← Panel admina
      </a>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${CARD_BORDER}`, marginBottom: 28 }}>
        {(['flashcards', 'readings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            color: tab === t ? NK : TEXT_MID,
            borderBottom: tab === t ? `2.5px solid ${NK}` : '2.5px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'flashcards' ? 'Fiszki' : 'Materiały'}
          </button>
        ))}
      </div>

      {/* ── Flashcards Tab ── */}
      {tab === 'flashcards' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>Fiszki</h2>
            <Btn onClick={openAddFC}>+ Dodaj fiszkę</Btn>
          </div>
          {errorFC && <ErrorBanner msg={errorFC} />}
          {loadingFC ? (
            <p style={{ color: TEXT_MID }}>Ładowanie…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${CARD_BORDER}` }}>
                    {['ID', 'System', 'Poziom', 'Struktura', 'Pytanie', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: TEXT_MID, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flashcards.map(fc => (
                    <tr key={fc.id} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                      <td style={{ padding: '8px 10px', color: TEXT_MID, fontFamily: 'monospace', fontSize: 12 }}>{fc.id}</td>
                      <td style={{ padding: '8px 10px' }}>{fc.system}</td>
                      <td style={{ padding: '8px 10px' }}>{fc.difficulty}</td>
                      <td style={{ padding: '8px 10px', color: TEXT_MID }}>{fc.struct || '—'}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 280 }} title={fc.question}>
                        {fc.question.length > 60 ? fc.question.slice(0, 60) + '…' : fc.question}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEditFC(fc)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                        <button onClick={() => deleteFC(fc.id)} style={{ ...actionBtnStyle, color: '#e05252', marginLeft: 6 }}>Usuń</button>
                      </td>
                    </tr>
                  ))}
                  {!flashcards.length && (
                    <tr><td colSpan={6} style={{ padding: '24px 10px', color: TEXT_MID, textAlign: 'center' }}>Brak fiszek</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Readings Tab ── */}
      {tab === 'readings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: TEXT_MAIN }}>Materiały do czytania</h2>
            <Btn onClick={openAddRM}>+ Dodaj materiał</Btn>
          </div>
          {errorRM && <ErrorBanner msg={errorRM} />}
          {loadingRM ? (
            <p style={{ color: TEXT_MID }}>Ładowanie…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {readings.map(rm => (
                <div key={rm.id} style={{ background: CARD_BG, border: `1.5px solid ${CARD_BORDER}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                    <button onClick={() => toggleExpandRM(rm.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: TEXT_MID }}>
                      {expandedRM.has(rm.id) ? '▼' : '▶'}
                    </button>
                    <span style={{ flex: 1, fontWeight: 600, color: TEXT_MAIN, fontSize: 14 }}>{rm.title}</span>
                    <span style={{ fontSize: 12.5, color: TEXT_MID }}>{rm.sys} · {rm.read_time} min</span>
                    <button onClick={() => openEditRM(rm)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                    <button onClick={() => deleteRM(rm.id)} style={{ ...actionBtnStyle, color: '#e05252' }}>Usuń</button>
                  </div>
                  {expandedRM.has(rm.id) && (
                    <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: '12px 16px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: TEXT_MID }}>Sekcje ({rm.reading_sections.length})</span>
                        <button onClick={() => openAddSec(rm.id)} style={{ ...actionBtnStyle, color: NK, fontWeight: 700 }}>+ Dodaj sekcję</button>
                      </div>
                      {[...rm.reading_sections].sort((a, b) => a.sort_order - b.sort_order).map(sec => (
                        <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${CARD_BORDER}` }}>
                          <span style={{ flex: 1, fontSize: 13, color: TEXT_MAIN }}>{sec.title}</span>
                          <span style={{ fontSize: 12, color: TEXT_MID }}>#{sec.sort_order}</span>
                          <button onClick={() => openEditSec(rm.id, sec)} style={{ ...actionBtnStyle, color: NK }}>Edytuj</button>
                          <button onClick={() => deleteSec(rm.id, sec.id)} style={{ ...actionBtnStyle, color: '#e05252' }}>Usuń</button>
                        </div>
                      ))}
                      {!rm.reading_sections.length && <p style={{ fontSize: 13, color: TEXT_MID, margin: 0 }}>Brak sekcji</p>}
                    </div>
                  )}
                </div>
              ))}
              {!readings.length && <p style={{ color: TEXT_MID }}>Brak materiałów</p>}
            </div>
          )}
        </div>
      )}

      {/* ── Flashcard Modal ── */}
      {fcModal && (
        <Modal title={fcModal === 'add' ? 'Dodaj fiszkę' : 'Edytuj fiszkę'} onClose={() => setFcModal(null)}>
          {formErrFC && <ErrorBanner msg={formErrFC} />}
          <Field label="ID *">
            <input style={inputStyle} value={fcForm.id ?? ''} disabled={fcModal === 'edit'}
              onChange={e => setFcForm(f => ({ ...f, id: e.target.value }))} />
          </Field>
          <Field label="System *">
            <select style={inputStyle} value={fcForm.system ?? SYSTEMS[0]}
              onChange={e => setFcForm(f => ({ ...f, system: e.target.value }))}>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Poziom trudności *">
            <select style={inputStyle} value={fcForm.difficulty ?? 'basic'}
              onChange={e => setFcForm(f => ({ ...f, difficulty: e.target.value as DbFlashcard['difficulty'] }))}>
              <option value="basic">Podstawowy</option>
              <option value="intermediate">Średniozaawansowany</option>
              <option value="advanced">Zaawansowany</option>
            </select>
          </Field>
          <Field label="Struktura">
            <input style={inputStyle} value={fcForm.struct ?? ''}
              onChange={e => setFcForm(f => ({ ...f, struct: e.target.value }))} />
          </Field>
          <Field label="Pytanie *">
            <textarea style={textareaStyle} value={fcForm.question ?? ''}
              onChange={e => setFcForm(f => ({ ...f, question: e.target.value }))} />
          </Field>
          <Field label="Odpowiedź *">
            <textarea style={textareaStyle} value={fcForm.answer ?? ''}
              onChange={e => setFcForm(f => ({ ...f, answer: e.target.value }))} />
          </Field>
          <Field label="Mnemonic">
            <textarea style={textareaStyle} value={fcForm.mnemonic ?? ''}
              onChange={e => setFcForm(f => ({ ...f, mnemonic: e.target.value }))} />
          </Field>
          <Field label="Szczegóły">
            <textarea style={textareaStyle} value={fcForm.details ?? ''}
              onChange={e => setFcForm(f => ({ ...f, details: e.target.value }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setFcModal(null)}>Anuluj</Btn>
            <Btn onClick={saveFC} disabled={savingFC}>{savingFC ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Reading Material Modal ── */}
      {rmModal && (
        <Modal title={rmModal === 'add' ? 'Dodaj materiał' : 'Edytuj materiał'} onClose={() => setRmModal(null)}>
          {formErrRM && <ErrorBanner msg={formErrRM} />}
          <Field label="Układ *">
            <select style={inputStyle} value={rmForm.sys}
              onChange={e => setRmForm(f => ({ ...f, sys: e.target.value }))}>
              {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Tytuł *">
            <input style={inputStyle} value={rmForm.title}
              onChange={e => setRmForm(f => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Czas czytania (min) *">
            <input style={inputStyle} type="number" min={1} value={rmForm.read_time}
              onChange={e => setRmForm(f => ({ ...f, read_time: Number(e.target.value) }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setRmModal(null)}>Anuluj</Btn>
            <Btn onClick={saveRM} disabled={savingRM}>{savingRM ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}

      {/* ── Section Modal ── */}
      {secModal && (
        <Modal title={secModal.mode === 'add' ? 'Dodaj sekcję' : 'Edytuj sekcję'} onClose={() => setSecModal(null)}>
          {formErrSec && <ErrorBanner msg={formErrSec} />}
          <Field label="ID (slug) *">
            <input style={inputStyle} value={secForm.id} disabled={secModal.mode === 'edit'}
              onChange={e => setSecForm(f => ({ ...f, id: e.target.value }))} />
          </Field>
          <Field label="Tytuł *">
            <input style={inputStyle} value={secForm.title}
              onChange={e => setSecForm(f => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Treść *">
            <textarea style={{ ...textareaStyle, minHeight: 160 }} value={secForm.content}
              onChange={e => setSecForm(f => ({ ...f, content: e.target.value }))} />
          </Field>
          <Field label="Kolejność">
            <input style={inputStyle} type="number" value={secForm.sort_order}
              onChange={e => setSecForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setSecModal(null)}>Anuluj</Btn>
            <Btn onClick={saveSec} disabled={savingSec}>{savingSec ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
