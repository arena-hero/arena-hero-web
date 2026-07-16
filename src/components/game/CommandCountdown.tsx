import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StreamPhase } from '../../lib/types'

export const COMMAND_WINDOW_MS = 15_000

export function CommandCountdown({ phase, startedAt }: { phase: StreamPhase; startedAt: number | null }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (phase !== 'open' || startedAt === null) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [phase, startedAt])

  if (phase !== 'open' || startedAt === null) return null

  const remainingMs = Math.max(0, COMMAND_WINDOW_MS - (now - startedAt))
  const progress = remainingMs / COMMAND_WINDOW_MS
  const urgent = remainingMs <= 5_000
  const remaining = (remainingMs / 1000).toFixed(1)

  return <div
    className="panel mt-2 overflow-hidden rounded-gold px-3 py-2"
    role="progressbar"
    aria-label={t('game.commandWindow')}
    aria-valuemin={0}
    aria-valuemax={15}
    aria-valuenow={Number(remaining)}
    aria-valuetext={`${remaining} ${t('game.secondsRemaining')}`}
  >
    <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] tracking-[.12em]">
      <span className="text-zinc-500">{t('game.commandWindow')}</span>
      <span className={urgent ? 'text-coral-hostile' : 'text-blue-soft'}>{remaining}s</span>
    </div>
    <div className="h-1 overflow-hidden rounded-full bg-white/[.07]">
      <div
        className={`h-full origin-left rounded-full transition-transform duration-100 ease-linear ${urgent ? 'bg-coral-hostile shadow-[0_0_8px_rgba(198,99,112,.35)]' : 'bg-cyan-signal shadow-[0_0_8px_rgba(69,145,197,.35)]'}`}
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  </div>
}
