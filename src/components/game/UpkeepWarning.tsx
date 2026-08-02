import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PlayerState } from '../../lib/types'

export function UpkeepWarning({ state, className = '' }: { state: PlayerState; className?: string }) {
  const { t } = useTranslation()
  const deficit = state.upkeep_next_tick - state.resources
  if (deficit <= 0) return null

  return <div
    role="alert"
    className={`flex min-w-0 items-start gap-2.5 rounded-gold border border-amber-300/20 bg-amber-300/[.07] px-3 py-2.5 text-amber-100 ${className}`}
  >
    <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-300" />
    <div className="min-w-0">
      <p className="font-display text-[11px] font-semibold leading-4">
        {t('game.upkeepShortfall', { deficit })}
      </p>
      <p className="mt-0.5 [overflow-wrap:anywhere] text-[10px] leading-4 text-amber-100/70">
        {t('game.upkeepShortfallConsequence')}
      </p>
    </div>
  </div>
}
