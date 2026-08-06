import { CircleAlert, Coins, HeartPulse, PackageOpen, Pickaxe, Trash2 } from 'lucide-react'
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
        const Icon = item.kind === 'FULL' || item.kind === 'DEPOSIT_FAILED' || item.kind === 'HEAL_FAILED'
          ? CircleAlert
          : item.kind === 'HEALED'
            ? HeartPulse
      : item.kind === 'CAPTURED'
      ? Coins
          : item.kind === 'DROPPED'
          ? PackageOpen
          : item.kind === 'DESTROYED' || item.kind === 'CORE_SELF_DESTRUCT'
            ? Trash2
            : Pickaxe
        const message = item.kind === 'FULL'
          ? t('game.coreResourceFull', { capacity: item.capacity })
          : item.kind === 'HEALED'
            ? t('game.healedHP', { amount: item.amount, hp: item.hp })
            : item.kind === 'HEAL_FAILED'
              ? t(item.reason === 'HP_FULL'
                ? 'game.healFailedHPFull'
                : item.reason === 'NOT_AT_OWN_CORE'
                  ? 'game.healFailedNotAtCore'
                  : item.reason === 'CORE_MOVING'
                    ? 'game.healFailedCoreMoving'
                    : 'game.healFailedResources')
      : item.kind === 'CAPTURED'
      ? t('game.coreResourcesCaptured', {
        amount: item.amount,
        available: item.available,
        destroyed: item.destroyed,
        capacity: item.capacity,
      })
          : item.kind === 'DEPOSIT_FAILED'
            ? t(item.reason === 'CORE_MOVING'
              ? 'game.depositCoreMoving'
              : item.reason === 'CORE_NOT_PRESENT'
                ? 'game.depositCoreNotPresent'
                : 'game.depositWorkerEmpty')
            : item.kind === 'DROPPED'
              ? t('game.cargoDropped', { count: item.amount })
              : item.kind === 'DESTROYED'
                ? t('game.resourceOverflowDestroyed', { count: item.amount })
                : item.kind === 'CORE_SELF_DESTRUCT'
                  ? t('game.coreSelfDestructed')
                : t('game.cargoRecovered', { count: item.amount })
        return <li key={item.eventId} className="flex min-h-11 items-center gap-2.5 px-3.5 py-2">
          <Icon
            aria-hidden="true"
            size={15}
            className={item.kind === 'FULL' || item.kind === 'DEPOSIT_FAILED' || item.kind === 'HEAL_FAILED'
              ? 'text-amber-300'
              : item.kind === 'HEALED'
                ? 'text-emerald-300'
        : item.kind === 'CAPTURED'
        ? 'text-emerald-300'
              : item.kind === 'DROPPED'
              ? 'text-violet-300'
              : item.kind === 'DESTROYED' || item.kind === 'CORE_SELF_DESTRUCT'
                ? 'text-red-300'
                : 'text-cyan-signal'}
          />
          <span className="min-w-0 flex-1 text-[11px] leading-4 text-zinc-300">
            {message}
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
