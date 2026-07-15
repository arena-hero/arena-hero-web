import { Coins, ShieldCheck, Users, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getErrorMessage } from '../../lib/errorMessage'
import type { GameEvent, PlayerState } from '../../lib/types'
import { EventLog } from './EventLog'

interface Props {
  mobileOpen: boolean
  state: PlayerState
  tick: number | null
  events: GameEvent[]
  error: string
  onCloseMobile: () => void
}

export function StatusPanel(props: Props) {
  const { t } = useTranslation()
  const items = [
    { label: t('game.resources'), value: props.state.resources, icon: Coins, color: 'text-green-resource' },
    { label: t('game.population'), value: props.state.population, icon: Users, color: 'text-cyan-signal' },
    { label: t('game.upkeep'), value: props.state.upkeep_next_tick, icon: ShieldCheck, color: 'text-violet-cosmic' },
  ]
  return <aside className={`panel-strong fixed inset-x-2 bottom-2 z-40 max-h-[72dvh] overflow-y-auto rounded-gold-lg shadow-2xl shadow-black/50 xl:static xl:inset-auto xl:flex xl:h-full xl:max-h-none xl:flex-col xl:overflow-hidden xl:rounded-none xl:border-y-0 xl:border-r-0 xl:shadow-none ${props.mobileOpen ? 'block' : 'hidden'}`}>
    <header className="border-b border-white/[.07] px-4 pb-4 pt-4 xl:pt-20">
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3 px-1">
        <div><p className="eyebrow">ARENA STATUS</p><h2 className="mt-1 font-display text-lg">{t('game.status')}</h2></div>
        <div className="flex items-center gap-2"><span className="font-mono text-[9px] text-zinc-600">TICK {props.tick ?? '—'}</span><button onClick={props.onCloseMobile} className="focus-ring grid size-11 place-items-center rounded-gold text-zinc-500 hover:bg-white/5 hover:text-zinc-200 xl:hidden" aria-label="Close"><X size={18} /></button></div>
      </div>
      <div className="grid grid-cols-3 overflow-hidden rounded-gold border border-white/[.07] bg-white/[.02]">
        {items.map(({ label, value, icon: Icon, color }) => <div key={label} className="min-w-0 border-r border-white/[.07] px-2.5 py-3 last:border-0"><div className="flex items-center gap-1.5"><Icon size={14} className={color} /><span className="font-mono text-sm font-semibold text-zinc-100">{value}</span></div><div className="mt-1 truncate text-[9px] text-zinc-500">{label}</div></div>)}
      </div>
      {props.error && <div role="alert" className="mt-3 text-xs leading-5 text-coral-hostile">{getErrorMessage(props.error)}</div>}
    </header>
    <EventLog events={props.events} />
  </aside>
}
