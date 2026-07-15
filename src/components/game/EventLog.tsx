import { Activity, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GameEvent } from '../../lib/types'

export function EventLog({ events }: { events: GameEvent[] }) {
  const { t } = useTranslation()
  return <section className="flex min-h-0 flex-1 flex-col p-4"><div className="mb-3 flex items-center gap-2"><Activity size={14} className="text-violet-cosmic" /><h3 className="eyebrow text-zinc-400">{t('game.events')}</h3></div>
    <div className="max-h-[42dvh] space-y-2 overflow-y-auto xl:max-h-none xl:flex-1">
      {!events.length && <p className="text-xs text-zinc-600">{t('game.noEvents')}</p>}
      {events.map((event) => <div key={event.event_id} className="rounded-gold-sm bg-white/[.025] px-3 py-2"><div className="flex justify-between gap-3"><span className="font-mono text-[10px] text-zinc-300">{event.event_type}</span><span className="font-mono text-[9px] text-zinc-600">T{event.tick}</span></div>{event.position && <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600"><MapPin size={10} />{event.position.join(', ')}</div>}</div>)}
    </div>
  </section>
}
