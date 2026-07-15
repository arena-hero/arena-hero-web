import { Activity, Crosshair, Gem, HeartCrack, LoaderCircle, PackageOpen, RotateCcw, Shield, Skull, Swords } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'
import type { PlayerStats } from '../../lib/types'

export function StatsDialogContent() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void api.stats().then(setStats).catch(() => setError(getErrorMessage('STATS_UNAVAILABLE')))
  }, [])

  const cards = stats ? [
    ['damageDealt', stats.damage_dealt, Swords, 'text-coral-hostile'],
    ['damageReceived', stats.damage_received, Shield, 'text-violet-cosmic'],
    ['unitsDestroyed', stats.unit_destruction_participations, Crosshair, 'text-cyan-signal'],
    ['coresDestroyed', stats.core_destruction_participations, Skull, 'text-coral-hostile'],
    ['harvested', stats.resources_harvested, Gem, 'text-green-resource'],
    ['deposited', stats.resources_deposited, PackageOpen, 'text-green-resource'],
    ['spawned', stats.units_spawned, Activity, 'text-cyan-signal'],
    ['lost', stats.units_lost, HeartCrack, 'text-coral-hostile'],
    ['survival', stats.core_survival_ticks, Shield, 'text-violet-cosmic'],
    ['respawns', stats.respawn_count, RotateCcw, 'text-zinc-300'],
  ] as const : []

  if (!stats && !error) return <div className="grid min-h-44 place-items-center"><LoaderCircle className="animate-spin text-cyan-signal" aria-label={t('common.loading')} /></div>
  if (error) return <p role="alert" className="text-sm text-coral-hostile">{error}</p>

  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
    {cards.map(([label, value, Icon, color]) => <article key={label} className="panel rounded-gold-lg p-5">
      <Icon size={18} className={color} />
      <div className="mt-5 font-display text-3xl font-semibold">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs text-zinc-500">{t(`stats.${label}`)}</div>
    </article>)}
  </div>
}
