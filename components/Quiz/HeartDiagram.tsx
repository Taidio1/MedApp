'use client'

import { useState } from 'react'
import { HEART_AREAS, QZ_OK, QZ_OK_SOFT, QZ_ERR, QZ_ERR_SOFT } from './quizData'

const haptic = (pattern: number | number[]) => {
  try { if (navigator && navigator.vibrate) navigator.vibrate(pattern) } catch { }
}

interface HeartDiagramProps {
  selected: string | null
  onSelect: (id: string) => void
  target: string
  revealed: boolean
}

export function HeartDiagram({ selected, onSelect, target, revealed }: HeartDiagramProps) {
  const [hov, setHov] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg viewBox="0 0 200 188" style={{ width: 270, height: 255, display: 'block' }}>
        <rect width="200" height="188" fill="#fbf7ee" rx="6" />
        <path d="M 22,42 L 22,128 L 56,160 L 100,174 L 144,160 L 178,128 L 178,42"
          fill="none" stroke="rgba(91,78,60,0.18)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="100" y1="42" x2="100" y2="26" stroke="rgba(91,78,60,0.3)" strokeWidth="3" strokeLinecap="round" />
        <text x="100" y="21" textAnchor="middle" fontSize="7" fill="#80786d" fontFamily="Inter,sans-serif">Aorta</text>
        <line x1="130" y1="58" x2="150" y2="36" stroke="rgba(91,78,60,0.22)" strokeWidth="2.5" strokeLinecap="round" />
        <text x="157" y="34" fontSize="6" fill="#80786d" fontFamily="Inter,sans-serif">T. płucny</text>
        <line x1="158" y1="42" x2="158" y2="24" stroke="rgba(91,78,60,0.22)" strokeWidth="2.5" strokeLinecap="round" />
        <text x="163" y="22" fontSize="6" fill="#80786d" fontFamily="Inter,sans-serif">ŻGG</text>
        <line x1="20" y1="85.5" x2="180" y2="85.5" stroke="rgba(91,78,60,0.14)" strokeWidth="1" strokeDasharray="3,2" />
        <line x1="100" y1="42" x2="100" y2="170" stroke="rgba(91,78,60,0.14)" strokeWidth="1" strokeDasharray="3,2" />
        {HEART_AREAS.map(a => {
          const isSel = selected === a.id
          const isHov = hov === a.id && !revealed
          const isCorr = revealed && a.id === target
          const isWrong = revealed && isSel && a.id !== target
          let fill = a.fill, stk = a.stk, sw = 1.5, op = 0.62
          if (isHov) op = 0.9
          if (isSel && !revealed) { op = 1; sw = 2.5 }
          if (isCorr) { fill = QZ_OK_SOFT; stk = QZ_OK; sw = 2.5; op = 1 }
          if (isWrong) { fill = QZ_ERR_SOFT; stk = QZ_ERR; sw = 2.5; op = 1 }
          return (
            <g key={a.id}
              onClick={() => { if (revealed) return; haptic(18); onSelect(a.id) }}
              onMouseEnter={() => setHov(a.id)}
              onMouseLeave={() => setHov(null)}
              style={{ cursor: revealed ? 'default' : 'pointer' }}>
              <path d={a.path} fill={fill} stroke={stk} strokeWidth={sw} opacity={op}
                style={{ transition: 'all 0.18s ease' }} />
              <text x={a.lx} y={a.ly - 8} textAnchor="middle" fontSize="9.5" fontWeight="700"
                fill={stk} fontFamily="Inter,sans-serif" pointerEvents="none" opacity={op}>{a.abbr}</text>
              {(isHov || isSel || revealed) && (
                <text x={a.lx} y={a.ly + 5} textAnchor="middle" fontSize="6.5" fill={stk}
                  fontFamily="Inter,sans-serif" pointerEvents="none">{a.name}</text>
              )}
              {isCorr && <text x={a.lx} y={a.ly + 20} textAnchor="middle" fontSize="16" fill={QZ_OK} pointerEvents="none">✓</text>}
              {isWrong && <text x={a.lx} y={a.ly + 20} textAnchor="middle" fontSize="16" fill={QZ_ERR} pointerEvents="none">✗</text>}
            </g>
          )
        })}
        <text x="100" y="186" textAnchor="middle" fontSize="6.5" fill="#80786d" fontFamily="Inter,sans-serif">Koniuszek (apex)</text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', justifyContent: 'center' }}>
        {HEART_AREAS.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: a.fill, border: `1.5px solid ${a.stk}` }} />
            <span style={{ fontSize: 11, color: '#80786d', fontFamily: 'Inter,sans-serif' }}>{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
