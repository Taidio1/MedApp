'use client'

import { useState } from 'react'
import { AnatomyNode } from '@/lib/types'
import { anatomyTree, structures } from '@/lib/anatomyData'
import { useAppStore } from '@/lib/store'

// Rekurencyjny węzeł drzewa nawigacji
function TreeNode({ node, depth = 0 }: { node: AnatomyNode; depth?: number }) {
  // Węzły najwyższego poziomu domyślnie rozwinięte
  const [expanded, setExpanded] = useState(depth === 0)
  const { selectedStructure, setSelectedStructure } = useAppStore()

  const hasChildren = Boolean(node.children && node.children.length > 0)
  const isActive = selectedStructure?.id === node.structureId

  const handleClick = () => {
    // Rozwiń/zwiń jeśli ma dzieci
    if (hasChildren) setExpanded((prev) => !prev)

    // Zaznacz strukturę jeśli węzeł ma przypisaną strukturę
    if (node.structureId && structures[node.structureId]) {
      setSelectedStructure(structures[node.structureId])
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={[
          'w-full text-left py-1.5 rounded text-sm transition-colors',
          'flex items-center gap-1.5',
          isActive
            ? 'bg-[#7c3aed] text-white'
            : 'text-gray-300 hover:bg-[#2a2a4e] hover:text-white',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 14 + 8}px`, paddingRight: '8px' }}
      >
        {/* Strzałka rozwijania / marker liścia */}
        <span className="text-[10px] w-3 flex-shrink-0 opacity-60">
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </span>

        {/* Emoji ikony dla układów najwyższego poziomu */}
        {node.icon && (
          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#2a2a4e] text-[11px] font-bold leading-none text-[#c4b5fd]">
            {node.icon}
          </span>
        )}

        <span className="truncate">{node.label}</span>
      </button>

      {/* Dzieci węzła (jeśli rozwinięty) */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function PanelLeft() {
  return (
    <aside className="w-[280px] flex-shrink-0 bg-[#1a1a2e] border-r border-[#2a2a4e] overflow-y-auto flex flex-col">
      {/* Nagłówek panelu */}
      <div className="px-4 py-3 border-b border-[#2a2a4e] flex-shrink-0">
        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Układy Anatomiczne
        </h2>
      </div>

      {/* Drzewo nawigacji */}
      <nav className="p-2 flex-1">
        {anatomyTree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </nav>

      {/* Stopka panelu */}
      <div className="px-4 py-3 border-t border-[#2a2a4e] flex-shrink-0">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Kliknij strukturę aby wyświetlić szczegóły i zapytać AI.
        </p>
      </div>
    </aside>
  )
}
