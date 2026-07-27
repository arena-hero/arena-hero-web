import type { ReactNode } from 'react'
import { apiURL } from '../../lib/api'

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

export function AuthDivider({ label }: { label: string }) {
  return <div className="my-5 flex items-center gap-3 text-[10px] font-mono text-zinc-600"><span className="h-px flex-1 bg-white/10" />{label}<span className="h-px flex-1 bg-white/10" /></div>
}

export function GitHubAuthLink({ label }: { label: string }) {
  return <a href={apiURL('/api/v1/auth/github/start')} className="secondary-button flex w-full items-center justify-center gap-2">
    <svg aria-hidden="true" className="github-logo size-[18px] shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
    {label}
  </a>
}

export function LinuxDOAuthLink({ label }: { label: string }) {
  return <a
    href={apiURL('/api/v1/auth/linux-do/start')}
    className="linux-do-auth-link focus-ring flex min-h-11 w-full items-center justify-center rounded-gold px-4 text-sm font-semibold"
    style={{ backgroundColor: '#FFB001', color: '#17120a' }}
  >
    {label}
  </a>
}
