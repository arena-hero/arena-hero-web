import { Check, ChevronRight, FastForward, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  step: number
  busy: boolean
  feedback: string
  onContinue: () => void
  onSkip: () => void
  onEnterArena: () => void
}

const ACTIONABLE_NEXT_STEPS = new Set([0, 1])
const TOTAL_STEPS = 12

export function TutorialCoach({ step, busy, feedback, onContinue, onSkip, onEnterArena }: Props) {
  const { t } = useTranslation()
  const complete = step >= TOTAL_STEPS
  const visibleStep = Math.min(step + 1, TOTAL_STEPS)

  return <aside aria-labelledby="tutorial-title" className="panel absolute bottom-3 left-3 right-3 z-40 overflow-hidden rounded-gold-lg shadow-2xl shadow-black/60 sm:left-auto sm:w-[22rem]">
    <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-blue-soft">{t('tutorial.progress', { current: visibleStep, total: TOTAL_STEPS })}</span>
        {busy && <span className="flex items-center gap-1.5 text-[10px] text-cyan-signal"><FastForward size={12} />{t('tutorial.fastForward')}</span>}
      </div>
      {!complete && <button type="button" onClick={onSkip} className="focus-ring grid size-9 place-items-center rounded-gold-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-200" aria-label={t('tutorial.skip')}><X size={15} /></button>}
    </div>
    <div className="flex gap-1 px-4 pt-3" aria-hidden="true">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => <span key={index} className={`h-0.5 flex-1 rounded-full ${index < visibleStep ? 'bg-cyan-signal' : 'bg-white/[.08]'}`} />)}
    </div>
    <div className="px-4 pb-4 pt-3">
      <h1 id="tutorial-title" className="font-display text-lg font-semibold tracking-[-.02em] text-zinc-100">{t(`tutorial.steps.${step}.title`)}</h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{t(`tutorial.steps.${step}.body`)}</p>
      {!complete && <p className="mt-3 border-l-2 border-cyan-signal/55 pl-3 text-xs leading-5 text-blue-soft">{busy ? t('tutorial.fastForwardHelp') : t(`tutorial.steps.${step}.hint`)}</p>}
      <div aria-live="polite" className="min-h-5">
        {feedback && <p className="mt-2 text-xs text-coral-hostile">{feedback}</p>}
      </div>
      {ACTIONABLE_NEXT_STEPS.has(step) && <button type="button" onClick={onContinue} className="primary-button mt-2 flex w-full items-center justify-center gap-2">{t(step === 0 ? 'tutorial.start' : 'tutorial.continue')}<ChevronRight size={15} /></button>}
      {complete && <button type="button" onClick={onEnterArena} className="primary-button mt-2 flex w-full items-center justify-center gap-2"><Check size={15} />{t('tutorial.enterArena')}</button>}
    </div>
  </aside>
}
