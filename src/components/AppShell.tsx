import { Bot } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { AccountMenu } from './AccountMenu'

export function AppShell() {
  const location = useLocation()
  return <div className="cosmic-bg min-h-dvh bg-space-950 text-zinc-100">
    <a href="#main-content" className="focus-ring fixed left-3 top-3 z-[60] -translate-y-20 rounded-gold bg-space-900 px-4 py-3 text-sm text-zinc-100 focus:translate-y-0">Skip to content</a>
    <div className="fixed right-3 top-3 z-50"><AccountMenu /></div>
    <main id="main-content" className="min-h-dvh"><Outlet /></main>
    {location.pathname === '/arena' && <div className="pointer-events-none fixed bottom-4 left-4 z-50 hidden items-center gap-2 rounded-full border border-violet-cosmic/20 bg-space-950/80 px-3 py-1.5 text-[10px] font-mono tracking-wider text-violet-cosmic xl:flex"><Bot size={12} /> LOCAL AGENT READY</div>}
  </div>
}
