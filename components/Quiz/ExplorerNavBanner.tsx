'use client'

interface ExplorerNavBannerProps {
  structure: string
  system: string
  onDismiss: () => void
}

export function ExplorerNavBanner({ structure, system, onDismiss }: ExplorerNavBannerProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 16px', background: 'var(--qz-accent-soft)',
      border: '1px solid rgba(124,107,196,0.45)', borderRadius: 9,
      marginBottom: 4, animation: 'qz-rise-in 0.3s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, opacity: 0.8 }}>↗</span>
        <div style={{ fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#28231c', lineHeight: 1.4 }}>
          <span style={{ color: '#80786d' }}>Nawigacja z </span><strong>Explorer</strong>
          <span style={{ color: 'rgba(91,78,60,0.3)', margin: '0 6px' }}>·</span>
          <strong style={{ color: 'var(--qz-accent)' }}>{structure}</strong>
          <span style={{ color: '#80786d', marginLeft: 5, fontStyle: 'italic', fontSize: 12 }}>{system}</span>
        </div>
      </div>
      <button onClick={onDismiss} style={{
        background: 'rgba(124,107,196,0.14)', border: 'none', borderRadius: 5,
        color: '#80786d', cursor: 'pointer', fontSize: 15, width: 24, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>×</button>
    </div>
  )
}
