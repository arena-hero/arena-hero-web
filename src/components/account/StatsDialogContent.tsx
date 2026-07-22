import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'
import { PLAYER_STAT_ICON_PATHS } from '../../lib/statArt'
import type { PlayerStats } from '../../lib/types'

export function StatsDialogContent() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void api.stats().then(setStats).catch(() => setError(getErrorMessage('STATS_UNAVAILABLE')))
  }, [])

  const cards = stats ? [
    ['damageDealt', stats.damage_dealt, PLAYER_STAT_ICON_PATHS.damageDealt],
    ['damageReceived', stats.damage_received, PLAYER_STAT_ICON_PATHS.damageReceived],
    ['unitsDestroyed', stats.unit_destruction_participations, PLAYER_STAT_ICON_PATHS.unitsDestroyed],
    ['coresDestroyed', stats.core_destruction_participations, PLAYER_STAT_ICON_PATHS.coresDestroyed],
    ['harvested', stats.resources_harvested, PLAYER_STAT_ICON_PATHS.harvested],
    ['deposited', stats.resources_deposited, PLAYER_STAT_ICON_PATHS.deposited],
    ['beaconPickups', stats.beacon_pickups ?? 0, PLAYER_STAT_ICON_PATHS.beaconPickups],
    ['beaconTicksHeld', stats.beacon_ticks_held ?? 0, PLAYER_STAT_ICON_PATHS.beaconTicksHeld],
    ['beaconBonusHarvested', stats.beacon_bonus_resources_harvested ?? 0, PLAYER_STAT_ICON_PATHS.beaconBonusHarvested],
    ['spawned', stats.units_spawned, PLAYER_STAT_ICON_PATHS.spawned],
    ['lost', stats.units_lost, PLAYER_STAT_ICON_PATHS.lost],
    ['survival', stats.core_survival_ticks, PLAYER_STAT_ICON_PATHS.survival],
    ['respawns', stats.respawn_count, PLAYER_STAT_ICON_PATHS.respawns],
  ] as const : []

  if (!stats && !error) return <div className="grid min-h-44 place-items-center"><LoaderCircle className="animate-spin text-cyan-signal" aria-label={t('common.loading')} /></div>
  if (error) return <p role="alert" className="text-sm text-coral-hostile">{error}</p>

  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {cards.map(([label, value, icon]) => <article key={label} className="panel rounded-gold-lg p-5">
      <img src={icon} alt="" aria-hidden="true" draggable={false} className="size-9 select-none object-contain" />
      <div className="mt-4 font-display text-3xl font-semibold">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-zinc-500">{t(`stats.${label}`)}</div>
    </article>)}
  </div>
}
