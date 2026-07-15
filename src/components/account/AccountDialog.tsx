import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  size?: 'medium' | 'wide'
  returnFocusRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  children: ReactNode
}

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AccountDialog({ eyebrow, title, subtitle, size = 'wide', returnFocusRef, onClose, children }: Props) {
  const { t } = useTranslation()
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const returnFocus = returnFocusRef.current
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      // A native child dialog owns focus and Escape while it is open.
      if (document.querySelector('dialog[open]')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      returnFocus?.focus()
    }
  }, [onClose, returnFocusRef])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`panel flex max-h-[min(88dvh,54rem)] w-full flex-col overflow-hidden rounded-gold-xl shadow-2xl shadow-black/60 outline-none ${size === 'wide' ? 'max-w-6xl' : 'max-w-2xl'}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/[.07] px-5 py-5 sm:px-7">
          <div>
            <p className="eyebrow text-cyan-signal">{eyebrow}</p>
            <h2 id={titleId} className="mt-2 font-display text-2xl font-semibold text-zinc-100">{title}</h2>
            {subtitle && <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-11 shrink-0 place-items-center rounded-gold text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
