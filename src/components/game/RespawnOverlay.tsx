import { RotateCcw, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RESPAWN_DELAY_TICKS } from '../../lib/gameRules'

export function RespawnOverlay({ remainingTicks, destroyedBy }: { remainingTicks: number; destroyedBy: string | null }) {
  const { t } = useTranslation()
  const waiting = remainingTicks > 0
  const elapsedTicks = Math.min(RESPAWN_DELAY_TICKS, Math.max(0, RESPAWN_DELAY_TICKS - remainingTicks))
  const progress = elapsedTicks / RESPAWN_DELAY_TICKS

  return <div className="absolute inset-0 z-20 grid place-items-center overflow-hidden bg-black/80 px-6 backdrop-blur-[2px]" role="status" aria-live="polite">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,99,112,.07),transparent_42%)]" />
    <div className="relative w-full max-w-lg text-center">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-gold-lg border border-coral-hostile/30 bg-coral-hostile/[.05] text-coral-hostile shadow-[0_0_36px_rgba(198,99,112,.1)]">
        {waiting ? <ShieldX size={30} strokeWidth={1.5} /> : <RotateCcw size={30} strokeWidth={1.5} className="motion-safe:animate-spin" />}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t(destroyedBy ? 'game.respawningBy' : 'game.respawningUnknown', { destroyer: destroyedBy })}</h1>
      {waiting ? <>
        <div className="mx-auto mt-8 max-w-sm">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-white/[.08]"
            role="progressbar"
            aria-label={t('game.respawnProgress')}
            aria-valuemin={0}
            aria-valuemax={RESPAWN_DELAY_TICKS}
            aria-valuenow={elapsedTicks}
            aria-valuetext={t('game.respawnRemaining', { count: remainingTicks })}
          >
            <div className="h-full origin-left rounded-full bg-cyan-signal shadow-[0_0_9px_rgba(69,145,197,.38)] transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <p className="mt-3 font-mono text-sm tabular-nums text-cyan-signal">{t('game.respawnRemaining', { count: remainingTicks })}</p>
        </div>
      </> : <p className="mt-8 text-sm text-cyan-signal">{t('game.respawnReady')}</p>}
      <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <p className="mx-auto mt-5 max-w-sm text-xs leading-5 text-zinc-500">{t('game.respawnHint')}</p>
    </div>
  </div>
}
