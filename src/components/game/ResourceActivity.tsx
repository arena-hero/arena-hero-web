import { CircleAlert, PackageOpen, Pickaxe, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { resourceActivityFromEvents } from '../../lib/resourceActivity'
import type { GameEvent } from '../../lib/types'

const visibleItemLimit = 3

export function ResourceActivity({ events }: { events: GameEvent[] }) {
  const { t } = useTranslation()
  const items = useMemo(() => resourceActivityFromEvents(events), [events])
  if (!items.length) return null

  const visibleItems = items.slice(0, visibleItemLimit)
  const hiddenCount = items.length - visibleItems.length

  return <section
    aria-live="polite"
    aria-label={t('game.resourceActivity')}
    className="panel-strong pointer-events-none absolute bottom-20 left-4 z-20 w-[min(22rem,calc(100%-2rem))] overflow-hidden rounded-gold-lg shadow-[0_12px_30px_rgba(0,0,0,.34)] [contain:paint]"
  >
    <h2 className="border-b border-white/[.07] px-3.5 py-2.5 font-display text-[11px] font-semibold text-zinc-200">
      {t('game.resourceActivity')}
    </h2>
    <ul className="divide-y divide-white/[.055]">
      {visibleItems.map((item) => {
        const Icon = item.kind === 'FULL'
          ? CircleAlert
          : item.kind === 'DROPPED'
          ? PackageOpen
          : item.kind === 'DESTROYED'
            ? Trash2
            : Pickaxe
        const translationKey = item.kind === 'FULL'
          ? 'game.coreResourceFull'
          : item.kind === 'DROPPED'
          ? 'game.cargoDropped'
          : item.kind === 'DESTROYED'
            ? 'game.resourceOverflowDestroyed'
            : 'game.cargoRecovered'
        return <li key={item.eventId} className="flex min-h-11 items-center gap-2.5 px-3.5 py-2">
          <Icon
            aria-hidden="true"
            size={15}
            className={item.kind === 'FULL'
              ? 'text-amber-300'
              : item.kind === 'DROPPED'
              ? 'text-violet-300'
              : item.kind === 'DESTROYED'
                ? 'text-red-300'
                : 'text-cyan-signal'}
          />
          <span className="min-w-0 flex-1 text-[11px] leading-4 text-zinc-300">
            {item.kind === 'FULL' ? t(translationKey, { capacity: item.capacity }) : t(translationKey, { count: item.amount })}
          </span>
          <span className="shrink-0 font-mono text-[9px] text-zinc-500">
            [{item.position.join(', ')}]
          </span>
        </li>
      })}
    </ul>
    {hiddenCount > 0 && <p className="border-t border-white/[.055] px-3.5 py-2 text-[10px] text-zinc-500">
      {t('game.moreResourceEvents', { count: hiddenCount })}
    </p>}
  </section>
}
