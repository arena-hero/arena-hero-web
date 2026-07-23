import type { ReactNode } from 'react'

export function AuthCard({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children: ReactNode }) {
  return <section className="auth-card">
    <div className="mb-7">{eyebrow && <p className="eyebrow mb-3 text-cyan-signal">{eyebrow}</p>}<h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-zinc-100 sm:text-[2rem]">{title}</h1>{subtitle && <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">{subtitle}</p>}</div>
    {children}
  </section>
}

export function FormField({ label, trailing, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; trailing?: ReactNode }) {
  const id = props.id ?? props.name
  return <div><label htmlFor={id} className="mb-2 block text-sm font-medium text-zinc-300">{label}</label><div className="relative"><input {...props} id={id} className={`input ${trailing ? 'pr-12' : ''} ${className}`} />{trailing}</div></div>
}

export function FormError({ message }: { message?: string }) {
  return message ? <div role="alert" className="rounded-gold border border-coral-hostile/20 bg-coral-hostile/5 px-4 py-3 text-sm text-coral-hostile">{message}</div> : null
}
