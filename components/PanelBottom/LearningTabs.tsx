'use client'

import { LearningTabId, learningTabs } from '@/lib/learning'

interface LearningTabsProps {
  activeTab: LearningTabId
  onChange: (tab: LearningTabId) => void
}

export function LearningTabs({ activeTab, onChange }: LearningTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {learningTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'h-7 rounded-md px-3 text-[11px] font-semibold transition-colors',
            activeTab === tab.id
              ? 'bg-[#7c3aed] text-white shadow-[0_8px_18px_rgba(124,58,237,0.18)]'
              : 'bg-white text-[#6b7280] hover:bg-[#f4f0ff]',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
