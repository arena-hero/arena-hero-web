import { Coins, ShieldCheck, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PlayerState } from '../../lib/types'

export function GameStats({ state, className = '' }: { state?: PlayerState; className?: string }) {
  const { t } = useTranslation()
  if (!state) return null
  const items = [
    { label: t('game.resources'), value: state.resources, icon: Coins, color: 'text-blue-soft' },
    { label: t('game.population'), value: state.population, icon: Users, color: 'text-cyan-signal' },
    { label: t('game.upkeep'), value: state.upkeep_next_tick, icon: ShieldCheck, color: 'text-violet-cosmic' },
  ]

  return <div role="group" aria-label={t('game.status')} className={`grid grid-cols-3 overflow-hidden rounded-gold border border-white/[.07] bg-white/[.02] ${className}`}>
    {items.map(({ label, value, icon: Icon, color }) => <div key={label} className="min-w-0 border-r border-white/[.07] px-2.5 py-3 last:border-0">
      <div className="flex items-center gap-1.5"><span className="grid size-6 shrink-0 place-items-center rounded-gold-sm border border-violet-cosmic/15 bg-indigo-deep/60"><Icon size={13} className={color} /></span><span className="font-mono text-sm font-semibold text-zinc-100">{value}</span></div>
      <div className="mt-1 truncate text-[9px] text-zinc-500">{label}</div>
    </div>)}
  </div>
}
