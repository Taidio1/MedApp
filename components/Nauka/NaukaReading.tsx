'use client'

import { ReadingMaterial } from '@/lib/naukaData'

interface NaukaReadingProps {
  material: ReadingMaterial | null
  sectionIdx: number
  onSectionChange: (i: number) => void
}

const NK = '#2a7a60'
const NK_SOFT = '#d2ede6'

const SYS_COLORS: Record<string, string> = {
  'Układ Krążenia':  '#bd514d',
  'Układ Oddechowy': '#4f8a3f',
  'Układ Pokarmowy': '#9b74b7',
  'OUN':             '#6578b5',
  'Układ Moczowy':   '#48a77d',
}

export function NaukaReading({ material, sectionIdx, onSectionChange }: NaukaReadingProps) {
  if (!material) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, animation: 'nk-rise-in 0.28s ease both' }}>
        <span style={{ fontSize: 36, marginBottom: 14 }}>📖</span>
        <p style={{ fontSize: 15, color: '#80786d', fontFamily: 'Inter,sans-serif', textAlign: 'center', maxWidth: 280 }}>
          Brak materiałów dla wybranego układu.<br />Wybierz inny układ w panelu po lewej.
        </p>
      </div>
    )
  }

  const section = material.sections[sectionIdx] ?? material.sections[0]
  const sysColor = SYS_COLORS[material.sys] ?? NK
  const hasPrev = sectionIdx > 0
  const hasNext = sectionIdx < material.sections.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'nk-rise-in 0.28s ease both' }}>

      {/* Header card */}
      <div style={{
        background: '#fbf7ee',
        border: '1px solid rgba(91,78,60,0.14)',
        borderRadius: 12, padding: '22px 26px',
        boxShadow: '0 8px 26px rgba(78,66,48,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            <h2 style={{
              margin: '0 0 6px',
              fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
              fontSize: 22, fontWeight: 500, color: '#28231c',
            }}>
              {material.title}
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                borderRadius: 20, fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                background: `${sysColor}18`, color: sysColor,
              }}>
                {material.sys}
              </span>
              <span style={{ fontSize: 12, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>
                ⏱ {material.readTime} min czytania
              </span>
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {material.sections.map((sec, i) => (
            <button key={sec.id} onClick={() => onSectionChange(i)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${i === sectionIdx ? NK : 'rgba(91,78,60,0.18)'}`,
                background: i === sectionIdx ? NK_SOFT : 'transparent',
                color: i === sectionIdx ? NK : '#80786d',
                fontSize: 12, fontFamily: 'Inter,sans-serif', fontWeight: i === sectionIdx ? 600 : 400,
                transition: 'all 0.15s',
              }}>
              {sec.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div key={`sec-${sectionIdx}`} style={{
        background: '#fbf7ee',
        border: '1px solid rgba(91,78,60,0.12)',
        borderRadius: 12, padding: '28px 32px',
        boxShadow: '0 4px 16px rgba(78,66,48,0.06)',
        animation: 'nk-rise-in 0.22s ease both',
      }}>
        <h3 style={{
          margin: '0 0 18px',
          fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
          fontSize: 18, fontWeight: 500, color: NK,
        }}>
          {section.title}
        </h3>
        {section.content.split('\n\n').map((para, i) => (
          <p key={i} style={{
            margin: i === 0 ? '0' : '18px 0 0',
            fontFamily: '"Iowan Old Style","Baskerville","Libre Baskerville",Georgia,serif',
            fontSize: 15.5, lineHeight: 1.9, color: '#2c251d',
            whiteSpace: 'pre-line',
          }}>
            {para}
          </p>
        ))}
      </div>

      {/* Prev / Next */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button onClick={() => hasPrev && onSectionChange(sectionIdx - 1)}
          style={{
            padding: '10px 22px', borderRadius: 8, cursor: hasPrev ? 'pointer' : 'not-allowed',
            border: '1.5px solid rgba(91,78,60,0.18)', background: 'transparent',
            color: hasPrev ? '#28231c' : '#80786d', fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600,
            opacity: hasPrev ? 1 : 0.4, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (hasPrev) (e.currentTarget as HTMLButtonElement).style.background = '#f1eadc' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          ← Poprzedni
        </button>
        <button onClick={() => hasNext && onSectionChange(sectionIdx + 1)}
          style={{
            padding: '10px 22px', borderRadius: 8, cursor: hasNext ? 'pointer' : 'not-allowed',
            border: `1.5px solid ${hasNext ? NK : 'rgba(91,78,60,0.18)'}`,
            background: hasNext ? NK_SOFT : 'transparent',
            color: hasNext ? NK : '#80786d', fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600,
            opacity: hasNext ? 1 : 0.4, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (hasNext) (e.currentTarget as HTMLButtonElement).style.background = '#c0e4d8' }}
          onMouseLeave={e => { if (hasNext) (e.currentTarget as HTMLButtonElement).style.background = NK_SOFT }}
        >
          Następny →
        </button>
      </div>

    </div>
  )
}
