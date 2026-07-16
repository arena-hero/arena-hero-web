import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard, FormError, FormField } from '../../components/auth/AuthCard'
import { useAuth } from '../../context/AuthContext'
import { getErrorMessage } from '../../lib/errorMessage'

export function LoginPage() {
  const { t } = useTranslation(); const { login } = useAuth(); const navigate = useNavigate()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { await login(email, password); navigate('/arena') } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow="OPERATOR ACCESS" title={t('auth.welcome')} subtitle={t('tagline')}>
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <FormField label={t('auth.email')} name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <FormField label={t('auth.password')} name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      <div className="flex justify-end"><Link to="/forgot-password" className="focus-ring rounded-gold-sm text-sm text-zinc-500 hover:text-cyan-signal">{t('auth.forgot')}</Link></div>
      <FormError message={error} />
      <button disabled={busy} className="primary-button flex w-full items-center justify-center gap-2">{busy && <LoaderCircle size={16} className="animate-spin" />}{t('auth.login')}</button>
    </form>
    <div className="my-5 flex items-center gap-3 text-[10px] font-mono text-zinc-600"><span className="h-px flex-1 bg-white/10" />OR<span className="h-px flex-1 bg-white/10" /></div>
    <a href="/api/v1/auth/github/start" className="secondary-button flex w-full items-center justify-center gap-2"><span className="font-display text-base" aria-hidden="true">GH</span>{t('auth.github')}</a>
    <p className="mt-6 text-center text-sm text-zinc-500">{t('auth.noAccount')} <Link to="/register" className="focus-ring rounded-gold-sm font-medium text-cyan-signal hover:text-blue-soft">{t('auth.register')}</Link></p>
    {import.meta.env.DEV && <Link to="/demo" className="mt-4 block text-center font-mono text-[10px] tracking-wider text-violet-cosmic hover:text-blue-soft">{t('common.demo')} →</Link>}
  </AuthCard>
}
