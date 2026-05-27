import Link from 'next/link'
import { BookOpenText, CircleQuestionMark, MapPinned, Settings2 } from 'lucide-react'

const tools = [
  {
    href: '/admin/nauka',
    title: 'Nauka',
    description: 'Fiszki i materiały do czytania',
    icon: BookOpenText,
    tone: 'green',
  },
  {
    href: '/admin/quiz',
    title: 'Quiz',
    description: 'Pytania, odpowiedzi i tryby sprawdzania wiedzy',
    icon: CircleQuestionMark,
    tone: 'violet',
  },
  {
    href: '/admin/annotations',
    title: 'Anotacje 3D',
    description: 'Punkty opisowe i podpowiedzi na modelach',
    icon: MapPinned,
    tone: 'brown',
  },
]

export function AdminToolsPanel() {
  return (
    <section className="profile-card profile-admin-tools" aria-labelledby="admin-tools-title">
      <div className="profile-section-heading">
        <span aria-hidden="true"><Settings2 size={17} strokeWidth={1.8} /></span>
        <div>
          <p>Panel administracyjny</p>
          <h2 id="admin-tools-title">Narzędzia treści</h2>
        </div>
      </div>

      <div className="profile-admin-grid">
        {tools.map((tool) => {
          const Icon = tool.icon

          return (
            <Link key={tool.href} href={tool.href} className={`profile-admin-tool profile-admin-tool--${tool.tone}`}>
              <span className="profile-admin-tool-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span>
                <strong>{tool.title}</strong>
                <small>{tool.description}</small>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
