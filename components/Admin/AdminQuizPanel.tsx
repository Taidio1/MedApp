'use client'

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

interface DbQuizQuestion {
  id: string
  type: 'mcq' | 'fill' | 'image'
  structure_id: string | null
  system_name: string
  difficulty: 'łatwy' | 'średni' | 'trudny'
  question_text: string
  options: string[] | null
  correct_index: number | null
  answer: string | null
  image_target: string | null
  hint: string | null
  explanation: string | null
  sort_order: number
  is_active: boolean
}

interface QForm {
  type: 'mcq' | 'fill' | 'image'
  system_name: string
  difficulty: 'łatwy' | 'średni' | 'trudny'
  question_text: string
  options: string[]
  correct_index: number | null
  answer: string
  image_target: string
  hint: string
  explanation: string
  sort_order: number
  is_active: boolean
}

// ── Constants ──────────────────────────────────────────────────────────────

const QZ = '#7c3aed'
const CARD_BORDER = 'rgba(91,78,60,0.14)'
const TEXT_MAIN = '#28231c'
const TEXT_MID = '#80786d'
const SERIF = '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif'
const SANS = 'Inter,sans-serif'

const QUIZ_SYSTEMS = ['Układ Krążenia', 'Układ Oddechowy', 'Układ Pokarmowy', 'OUN', 'Układ Moczowy', 'Wszystkie']

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

function blankForm(): QForm {
  return {
    type: 'mcq', system_name: QUIZ_SYSTEMS[0], difficulty: 'łatwy',
    question_text: '', options: ['', ''], correct_index: 0,
    answer: '', image_target: '', hint: '', explanation: '',
    sort_order: 0, is_active: true,
  }
}

function formFromQuestion(q: DbQuizQuestion): QForm {
  return {
    type: q.type, system_name: q.system_name, difficulty: q.difficulty,
    question_text: q.question_text, options: q.options ?? ['', ''],
    correct_index: q.correct_index, answer: q.answer ?? '',
    image_target: q.image_target ?? '', hint: q.hint ?? '',
    explanation: q.explanation ?? '', sort_order: q.sort_order, is_active: q.is_active,
  }
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Overlay({ onClose }: { onClose: () => void }) {
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, cursor: 'pointer' }} />
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <Overlay onClose={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 12, padding: 28, width: 560,
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
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'ghost'
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      padding: '7px 16px', borderRadius: 7,
      background: variant === 'ghost' ? 'transparent' : QZ,
      color: variant === 'ghost' ? TEXT_MID : '#fff',
      border: variant === 'ghost' ? `1.5px solid ${CARD_BORDER}` : 'none',
      fontFamily: SANS, fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}>
      {children}
    </button>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return <div style={{ color: '#c0392b', background: '#fdecea', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13.5 }}>{msg}</div>
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AdminQuizPanel() {
  const [questions, setQuestions] = useState<DbQuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingQ, setEditingQ] = useState<DbQuizQuestion | null>(null)
  const [form, setForm] = useState<QForm>(blankForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ type: '', system: '', difficulty: '', active: '' })

  async function loadQuestions() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/quiz/questions')
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setQuestions(await res.json())
    } catch (e) { setError(e instanceof Error ? e.message : 'Błąd') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadQuestions() }, [])

  function openAdd() { setEditingQ(null); setForm(blankForm()); setFormError(null); setModal('add') }
  function openEdit(q: DbQuizQuestion) { setEditingQ(q); setForm(formFromQuestion(q)); setFormError(null); setModal('edit') }

  async function save() {
    if (!form.question_text.trim()) { setFormError('Treść pytania jest wymagana'); return }
    if (form.type === 'mcq') {
      if (form.options.some(o => !o.trim())) { setFormError('Wszystkie opcje MCQ muszą być wypełnione'); return }
      if (form.correct_index === null) { setFormError('Wybierz poprawną odpowiedź'); return }
    }
    if ((form.type === 'fill' || form.type === 'image') && !form.answer.trim()) {
      setFormError('Pole odpowiedź jest wymagane'); return
    }
    setSaving(true); setFormError(null)
    try {
      const url = modal === 'edit' ? `/api/admin/quiz/questions/${editingQ!.id}` : '/api/admin/quiz/questions'
      const body: Record<string, unknown> = {
        type: form.type, system_name: form.system_name, difficulty: form.difficulty,
        question_text: form.question_text, hint: form.hint || null,
        explanation: form.explanation || null, sort_order: form.sort_order, is_active: form.is_active,
        options: form.type === 'mcq' ? form.options : null,
        correct_index: form.type === 'mcq' ? form.correct_index : null,
        answer: (form.type === 'fill' || form.type === 'image') ? form.answer : null,
        image_target: form.type === 'image' ? form.image_target || null : null,
      }
      const res = await fetch(url, {
        method: modal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      setModal(null); await loadQuestions()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Błąd') }
    finally { setSaving(false) }
  }

  async function deleteQ(id: string) {
    if (!window.confirm('Usunąć to pytanie?')) return
    try {
      const res = await fetch(`/api/admin/quiz/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Błąd') }
      await loadQuestions()
    } catch (e) { setError(e instanceof Error ? e.message : 'Błąd') }
  }

  async function toggleActive(q: DbQuizQuestion) {
    const next = !q.is_active
    setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: next } : x))
    try {
      const res = await fetch(`/api/admin/quiz/questions/${q.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      if (!res.ok) {
        setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: q.is_active } : x))
        const d = await res.json(); setError(d.error ?? 'Błąd przy zmianie statusu')
      }
    } catch (e) {
      setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, is_active: q.is_active } : x))
      setError(e instanceof Error ? e.message : 'Błąd')
    }
  }

  const filtered = questions.filter(q => {
    if (filters.type && q.type !== filters.type) return false
    if (filters.system && q.system_name !== filters.system) return false
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false
    if (filters.active === 'active' && !q.is_active) return false
    if (filters.active === 'inactive' && q.is_active) return false
    return true
  })

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: SANS }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT_MAIN, margin: '0 0 8px' }}>
        Quiz — Panel admina
      </h1>
      <a href="/admin" style={{ fontSize: 13, color: QZ, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
        ← Panel admina
      </a>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">Wszystkie typy</option>
          <option value="mcq">MCQ</option>
          <option value="fill">Uzupełnij</option>
          <option value="image">Obraz</option>
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.system}
          onChange={e => setFilters(f => ({ ...f, system: e.target.value }))}>
          <option value="">Wszystkie układy</option>
          {QUIZ_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.difficulty}
          onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
          <option value="">Wszystkie poziomy</option>
          <option value="łatwy">Łatwy</option>
          <option value="średni">Średni</option>
          <option value="trudny">Trudny</option>
        </select>
        <select style={{ ...inputStyle, width: 'auto' }} value={filters.active}
          onChange={e => setFilters(f => ({ ...f, active: e.target.value }))}>
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="inactive">Nieaktywne</option>
        </select>
        <div style={{ flex: 1 }} />
        <Btn onClick={openAdd}>+ Dodaj pytanie</Btn>
      </div>

      {error && <ErrorBanner msg={error} />}

      {loading ? <p style={{ color: TEXT_MID }}>Ładowanie…</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${CARD_BORDER}` }}>
                {['Pytanie', 'Typ', 'Układ', 'Poziom', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: TEXT_MID, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                  <td style={{ padding: '8px 10px', maxWidth: 300 }} title={q.question_text}>
                    {q.question_text.length > 70 ? q.question_text.slice(0, 70) + '…' : q.question_text}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ background: '#ede8ff', color: QZ, borderRadius: 5, padding: '2px 7px', fontSize: 12, fontWeight: 600 }}>{q.type}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: TEXT_MID, fontSize: 12.5 }}>{q.system_name}</td>
                  <td style={{ padding: '8px 10px', color: TEXT_MID }}>{q.difficulty}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      background: q.is_active ? '#d4f5e9' : '#f0f0f0',
                      color: q.is_active ? '#1a7a52' : TEXT_MID,
                      borderRadius: 5, padding: '2px 7px', fontSize: 12, fontWeight: 600,
                    }}>
                      {q.is_active ? 'Aktywne' : 'Nieaktywne'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleActive(q)} style={{ ...actionBtnStyle, color: q.is_active ? TEXT_MID : '#1a7a52' }}>
                      {q.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                    </button>
                    <button onClick={() => openEdit(q)} style={{ ...actionBtnStyle, color: QZ, marginLeft: 4 }}>Edytuj</button>
                    <button onClick={() => deleteQ(q.id)} style={{ ...actionBtnStyle, color: '#e05252', marginLeft: 4 }}>Usuń</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} style={{ padding: '24px 10px', color: TEXT_MID, textAlign: 'center' }}>Brak pytań</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Question Modal ── */}
      {modal && (
        <Modal title={modal === 'add' ? 'Dodaj pytanie' : 'Edytuj pytanie'} onClose={() => setModal(null)}>
          {formError && <ErrorBanner msg={formError} />}
          <Field label="Typ *">
            <select style={inputStyle} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as QForm['type'], options: ['', ''], correct_index: 0 }))}>
              <option value="mcq">MCQ (wybór)</option>
              <option value="fill">Uzupełnij lukę</option>
              <option value="image">Obraz</option>
            </select>
          </Field>
          <Field label="Układ anatomiczny *">
            <select style={inputStyle} value={form.system_name}
              onChange={e => setForm(f => ({ ...f, system_name: e.target.value }))}>
              {QUIZ_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Poziom trudności *">
            <select style={inputStyle} value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as QForm['difficulty'] }))}>
              <option value="łatwy">Łatwy</option>
              <option value="średni">Średni</option>
              <option value="trudny">Trudny</option>
            </select>
          </Field>
          <Field label="Treść pytania *">
            <textarea style={textareaStyle} value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
          </Field>

          {form.type === 'mcq' && (
            <Field label="Opcje odpowiedzi * (zaznacz poprawną)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="radio" name="correct_index" title="Poprawna odpowiedź"
                      checked={form.correct_index === i}
                      onChange={() => setForm(f => ({ ...f, correct_index: i }))}
                      style={{ flexShrink: 0 }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={opt} placeholder={`Opcja ${i + 1}`}
                      onChange={e => {
                        const opts = [...form.options]; opts[i] = e.target.value
                        setForm(f => ({ ...f, options: opts }))
                      }} />
                    {form.options.length > 2 && (
                      <button type="button" onClick={() => {
                        const opts = form.options.filter((_, j) => j !== i)
                        const ci = form.correct_index !== null && form.correct_index >= opts.length
                          ? opts.length - 1 : form.correct_index
                        setForm(f => ({ ...f, options: opts, correct_index: ci }))
                      }} style={{ background: 'none', border: 'none', color: '#e05252', cursor: 'pointer', fontSize: 18 }}>×</button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                    style={{ alignSelf: 'flex-start', background: 'none', border: `1.5px dashed ${CARD_BORDER}`, borderRadius: 7, padding: '5px 12px', color: TEXT_MID, cursor: 'pointer', fontSize: 13 }}>
                    + Dodaj opcję
                  </button>
                )}
              </div>
            </Field>
          )}

          {(form.type === 'fill' || form.type === 'image') && (
            <Field label="Odpowiedź *">
              <input style={inputStyle} value={form.answer}
                onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
            </Field>
          )}
          {form.type === 'image' && (
            <Field label="Cel obrazu (image_target)">
              <input style={inputStyle} value={form.image_target}
                onChange={e => setForm(f => ({ ...f, image_target: e.target.value }))} />
            </Field>
          )}

          <Field label="Podpowiedź (opcjonalne)">
            <input style={inputStyle} value={form.hint}
              onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} />
          </Field>
          <Field label="Wyjaśnienie (opcjonalne)">
            <textarea style={textareaStyle} value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
          </Field>
          <Field label="Kolejność">
            <input style={inputStyle} type="number" value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </Field>
          <Field label="Aktywne">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <span style={{ fontSize: 13.5, color: TEXT_MAIN }}>Pytanie aktywne</span>
            </label>
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Anuluj</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz'}</Btn>
          </div>
        </Modal>
      )}
    </main>
  )
}
