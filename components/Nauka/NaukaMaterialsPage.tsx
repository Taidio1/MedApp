import Link from 'next/link'
import type { ReadingMaterial } from '@/lib/naukaData'

interface NaukaMaterialsPageProps {
  readings: ReadingMaterial[]
  selectedSystem: string | null
}

const FALLBACK_ILLUSTRATIONS: Record<string, string> = {
  'Układ Krążenia': '/nauka-heart.png',
}

function resolveIllustration(reading: ReadingMaterial) {
  return reading.illustrationUrl || FALLBACK_ILLUSTRATIONS[reading.sys] || '/nauka-heart.png'
}

function buildMaterialsHref(system: string) {
  return `/nauka/materialy?system=${encodeURIComponent(system)}`
}

export function NaukaMaterialsPage({ readings, selectedSystem }: NaukaMaterialsPageProps) {
  const activeSystem = selectedSystem && readings.some(reading => reading.sys === selectedSystem)
    ? selectedSystem
    : readings[0]?.sys ?? null
  const activeReading = readings.find(reading => reading.sys === activeSystem) ?? readings[0] ?? null

  return (
    <main className="reading-materials-shell">
      <section className="reading-materials-hero">
        <div>
          <Link href="/nauka" className="reading-materials-back">← Nauka</Link>
          <h1>Materiały do czytania</h1>
          <p>Wybierz kategorię, a potem przejdź przez tematy zapisane w sekcjach materiału.</p>
        </div>
        <Link
          href={`/nauka?start=session${activeSystem ? `&system=${encodeURIComponent(activeSystem)}` : ''}`}
          className="reading-materials-session-link"
        >
          Rozpocznij sesję
        </Link>
      </section>

      <div className="reading-materials-layout">
        <aside className="reading-materials-categories" aria-label="Kategorie materiałów">
          <h2>Kategorie</h2>
          {readings.map(reading => (
            <Link
              key={reading.id}
              href={buildMaterialsHref(reading.sys)}
              className={reading.sys === activeSystem ? 'is-active' : ''}
            >
              <span>{reading.sys}</span>
              <small>{reading.sections.length} tematów · {reading.readTime} min</small>
            </Link>
          ))}
        </aside>

        {activeReading ? (
          <article className="reading-materials-article">
            <div className="reading-materials-visual">
              <img src={resolveIllustration(activeReading)} alt="" />
            </div>

            <header className="reading-materials-article-head">
              <span>{activeReading.sys}</span>
              <h2>{activeReading.title}</h2>
              <p>{activeReading.readTime} min czytania · {activeReading.sections.length} tematów</p>
            </header>

            <nav className="reading-materials-topics" aria-label="Tematy w materiale">
              {activeReading.sections.map(section => (
                <a key={section.id} href={`#${section.id}`}>{section.title}</a>
              ))}
            </nav>

            <div className="reading-materials-sections">
              {activeReading.sections.map(section => (
                <section key={section.id} id={section.id}>
                  <h3>{section.title}</h3>
                  {section.content.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </section>
              ))}
            </div>
          </article>
        ) : (
          <section className="reading-materials-empty">
            <h2>Brak materiałów</h2>
            <p>Dodaj pierwszy materiał w panelu admina, a pojawi się tutaj automatycznie.</p>
          </section>
        )}
      </div>
    </main>
  )
}
