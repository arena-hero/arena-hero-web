import { BarChart3, BookOpen, ChevronDown, Gamepad2, GitFork, KeyRound, LogOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LanguageToggle } from './LanguageToggle'
import { AccountDialog } from './account/AccountDialog'
import { APIKeysDialogContent } from './account/APIKeysDialogContent'
import { GitHubLinkDialogContent } from './account/GitHubLinkDialogContent'
import { StatsDialogContent } from './account/StatsDialogContent'

type AccountDialogType = 'stats' | 'keys' | 'github' | null

export function AccountMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState<AccountDialogType>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeDialog = useCallback(() => setDialog(null), [])
  const signOut = async () => { await logout(); navigate('/login') }
  const showDialog = (next: Exclude<AccountDialogType, null>) => { setOpen(false); setDialog(next) }

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const dialogItems = [
    { id: 'stats' as const, label: t('nav.stats'), icon: BarChart3 },
    { id: 'keys' as const, label: t('nav.keys'), icon: KeyRound },
    { id: 'github' as const, label: t('auth.linkGithub'), icon: GitFork },
  ]

  return <div ref={menuRef} className="relative">
    <button ref={triggerRef} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label={t('common.account')} className="panel focus-ring flex min-h-11 max-w-48 items-center gap-2 rounded-gold px-2.5 shadow-lg shadow-black/30 hover:bg-space-800">
      <span className="grid size-8 place-items-center rounded-gold-sm border border-violet-cosmic/15 bg-indigo-deep/70 font-display text-xs text-blue-soft">{user?.username.slice(0, 2).toUpperCase()}</span>
      <span className="max-w-28 truncate text-sm font-medium text-zinc-200">{user?.username}</span>
      <ChevronDown size={14} className={`text-zinc-600 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div role="menu" className="panel absolute right-0 top-14 z-50 w-64 rounded-gold-lg p-2 shadow-2xl shadow-black/50">
      <div className="border-b border-white/[.07] px-3 pb-3 pt-2"><p className="text-sm font-medium text-zinc-200">{user?.username}</p><p className="mt-1 truncate text-[10px] text-zinc-600">{user?.email}</p></div>
      <nav aria-label="Account navigation" className="mt-1">
        <NavLink role="menuitem" to="/arena" onClick={() => setOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-gold px-3 text-sm transition-colors ${isActive ? 'bg-indigo-deep/55 text-blue-soft' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}`}><Gamepad2 size={16} />{t('nav.arena')}</NavLink>
        <NavLink role="menuitem" to="/docs" onClick={() => setOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-gold px-3 text-sm transition-colors ${isActive ? 'bg-indigo-deep/55 text-blue-soft' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'}`}><BookOpen size={16} />{t('nav.docs')}</NavLink>
        {dialogItems.map(({ id, label, icon: Icon }) => <button role="menuitem" key={id} type="button" onClick={() => showDialog(id)} className="flex min-h-11 w-full items-center gap-3 rounded-gold px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"><Icon size={16} />{label}</button>)}
      </nav>
      <LanguageToggle className="w-full" />
      <button onClick={() => void signOut()} className="mt-1 flex min-h-11 w-full items-center gap-3 border-t border-white/[.07] px-3 pt-2 text-sm text-coral-hostile"><LogOut size={16} />{t('auth.logout')}</button>
    </div>}
    {dialog === 'stats' && <AccountDialog eyebrow="PRIVATE TELEMETRY" title={t('stats.title')} subtitle={t('stats.subtitle')} returnFocusRef={triggerRef} onClose={closeDialog}><StatsDialogContent /></AccountDialog>}
    {dialog === 'keys' && <AccountDialog eyebrow="AGENT CREDENTIALS" title={t('keys.title')} subtitle={t('keys.subtitle')} returnFocusRef={triggerRef} onClose={closeDialog}><APIKeysDialogContent /></AccountDialog>}
    {dialog === 'github' && <AccountDialog eyebrow="IDENTITY UPLINK" title={t('auth.linkGithub')} size="medium" returnFocusRef={triggerRef} onClose={closeDialog}><GitHubLinkDialogContent /></AccountDialog>}
  </div>
}
