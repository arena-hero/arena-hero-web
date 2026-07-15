import { Outlet } from 'react-router-dom'
import { LanguageToggle } from './LanguageToggle'
import { Logo } from './Logo'

export function AuthLayout() {
  return <main className="cosmic-bg relative grid min-h-dvh place-items-center overflow-hidden px-4 py-20">
    <div className="absolute left-5 top-5"><Logo /></div><div className="absolute right-4 top-4"><LanguageToggle /></div>
    <div className="absolute inset-x-0 top-[42%] h-px bg-gradient-to-r from-transparent via-cyan-signal/20 to-transparent" />
    <Outlet />
  </main>
}
