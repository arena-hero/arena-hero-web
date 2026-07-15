import type { ReactNode } from 'react'

export function AuthCard({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: ReactNode }) {
  return <section className="panel relative z-10 w-full max-w-md rounded-gold-xl p-6 shadow-2xl shadow-black/30 sm:p-8">
    <div className="mb-7"><p className="eyebrow mb-3 text-cyan-signal">{eyebrow}</p><h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>}</div>
    {children}
  </section>
}

export function FormField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = props.id ?? props.name
  return <label htmlFor={id} className="block"><span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span><input {...props} id={id} className="input" /></label>
}

export function FormError({ message }: { message?: string }) {
  return message ? <div role="alert" className="rounded-gold border border-coral-hostile/20 bg-coral-hostile/5 px-4 py-3 text-sm text-coral-hostile">{message}</div> : null
}
