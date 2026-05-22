import { requireUser } from '@/lib/auth/guards'
import { PanelLeft } from '@/components/PanelLeft/PanelLeft'
import { Viewer3D } from '@/components/Viewer3D/Viewer3D'
import { PanelRight } from '@/components/PanelRight/PanelRight'
import { PanelBottom } from '@/components/PanelBottom/PanelBottom'
import { UserMenu } from '@/components/UserMenu/UserMenu'

export default async function HomePage() {
  const profile = await requireUser()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 h-12 bg-[#12122a] border-b border-[#2a2a4e] flex items-center px-6 gap-4 z-10">
        {/* Logo i nazwa aplikacji */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">
            Anatomy Studio
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[#2a2a4e]" />

        {/* Nawigacja główna */}
        <nav className="flex items-center gap-1">
          {['Explorer', 'Compare', 'Exam Mode'].map((item) => (
            <button
              key={item}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4e] rounded transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Prawa część headera — user menu */}
        <div className="ml-auto flex items-center gap-2">
          <UserMenu
            email={profile.email}
            displayName={profile.displayName}
            isAdmin={profile.role === 'admin'}
          />
        </div>
      </header>

      {/* ===== GŁÓWNA ZAWARTOŚĆ ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== LEWY PANEL (280px) ===== */}
        <PanelLeft />

        {/* ===== PRAWA STRONA (viewer + prawy panel + dolny pasek) ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Środkowy rząd: viewer 3D + prawy panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* ===== CENTRALNY VIEWER 3D ===== */}
            <main className="flex-1 relative overflow-hidden">
              <Viewer3D />
            </main>

            {/* ===== PRAWY PANEL (320px) ===== */}
            <PanelRight />
          </div>

          {/* ===== DOLNY PASEK (120px) ===== */}
          <PanelBottom />
        </div>
      </div>
    </div>
  )
}
