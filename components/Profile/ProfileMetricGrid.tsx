export interface ProfileMetric {
  label: string
  value: string
  detail?: string
  tone?: 'accent' | 'green' | 'red' | 'blue' | 'muted'
}

interface ProfileMetricGridProps {
  metrics: ProfileMetric[]
}

export function ProfileMetricGrid({ metrics }: ProfileMetricGridProps) {
  return (
    <div className="profile-metric-grid">
      {metrics.map((metric) => (
        <div key={metric.label} className={`profile-metric profile-metric--${metric.tone ?? 'accent'}`}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.detail && <small>{metric.detail}</small>}
        </div>
      ))}
    </div>
  )
}
