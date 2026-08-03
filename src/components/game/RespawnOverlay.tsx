import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function RespawnOverlay({ destroyedBy, selfDestructed = false }: { destroyedBy: string | null; selfDestructed?: boolean }) {
  const { t } = useTranslation()

  return <div className="absolute inset-0 z-20 grid place-items-center overflow-hidden bg-black/80 px-6 backdrop-blur-[2px]" role="status" aria-live="polite">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,99,112,.07),transparent_42%)]" />
    <div className="relative w-full max-w-lg text-center">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-gold-lg border border-coral-hostile/30 bg-coral-hostile/[.05] text-coral-hostile shadow-[0_0_36px_rgba(198,99,112,.1)]">
        <ShieldX size={30} strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t(selfDestructed ? 'game.respawningSelfDestruct' : destroyedBy ? 'game.respawningBy' : 'game.respawningUnknown', { destroyer: destroyedBy })}</h1>
      <p className="mt-8 text-sm text-cyan-signal">{t('game.respawnWaiting')}</p>
      <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <p className="mx-auto mt-5 max-w-sm text-xs leading-5 text-zinc-500">{t('game.respawnHint')}</p>
    </div>
  </div>
}
