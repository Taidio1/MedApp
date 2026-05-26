'use client'

import { LearningTabId, learningTabs } from '@/lib/learning'

interface LearningTabsProps {
  activeTab: LearningTabId
  onChange: (tab: LearningTabId) => void
}

export function LearningTabs({ activeTab, onChange }: LearningTabsProps) {
  return (
    <div className="learning-tabs">
      {learningTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'learning-tab',
            activeTab === tab.id ? 'is-active' : '',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
