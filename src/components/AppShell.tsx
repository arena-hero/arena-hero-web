import { Outlet } from 'react-router-dom'
import { AccountMenu } from './AccountMenu'

export function AppShell() {
  return <div className="cosmic-bg min-h-dvh bg-space-950 text-zinc-100">
    <a href="#main-content" className="focus-ring fixed left-3 top-3 z-[60] -translate-y-20 rounded-gold bg-space-900 px-4 py-3 text-sm text-zinc-100 focus:translate-y-0">Skip to content</a>
    <div className="fixed right-3 top-3 z-50"><AccountMenu /></div>
    <main id="main-content" className="min-h-dvh"><Outlet /></main>
  </div>
}
