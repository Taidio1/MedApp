'use client'

// Slot na zdjęcie/obraz histologiczny (placeholder)
function ImageSlot({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '88px',
        height: '64px',
        borderRadius: '6px',
        background: '#ede8df',
        border: '1px dashed #d1d5db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1px solid #9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>+</span>
      </div>
      <span
        style={{
          fontSize: '9px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
    </div>
  )
}

// Slot do porównania (side-by-side)
function CompareSlot({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        borderRadius: '6px',
        border: '1px dashed #d1d5db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
          {side === 'left' ? 'Struktura A' : 'Struktura B'}
        </div>
        <div style={{ fontSize: '9px', color: '#d1d5db' }}>
          kliknij aby wybrać
        </div>
      </div>
    </div>
  )
}

export function PanelBottom() {
  return (
    <div
      style={{
        height: '120px',
        flexShrink: 0,
        background: '#f5f0e8',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* Sekcja: Microscope View */}
      <div
        style={{
          flex: 1,
          padding: '12px 20px',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Microscope View
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageSlot label="Preparat 1" />
          <ImageSlot label="Preparat 2" />
          <ImageSlot label="Preparat 3" />
        </div>
      </div>

      {/* Sekcja: Compare Cells */}
      <div
        style={{
          width: '280px',
          flexShrink: 0,
          padding: '12px 20px',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Compare Cells
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            height: '64px',
            alignItems: 'center',
          }}
        >
          <CompareSlot side="left" />
          <div style={{ color: '#d1d5db', fontSize: '11px', flexShrink: 0 }}>
            vs
          </div>
          <CompareSlot side="right" />
        </div>
      </div>
    </div>
  )
}
