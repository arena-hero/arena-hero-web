import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { AuthCard, AuthDivider, FormError, FormField, GitHubAuthLink, LinuxDOAuthLink } from '../../components/auth/AuthCard'
import { useAuth } from '../../context/AuthContext'
import { useEmailRegistrationEnabled } from '../../hooks/useAuthOptions'
import { getErrorMessage } from '../../lib/errorMessage'

export function LoginPage() {
  const { t } = useTranslation(); const { login } = useAuth(); const navigate = useNavigate()
  const emailRegistrationEnabled = useEmailRegistrationEnabled()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { await login(email, password); navigate('/arena') } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow={t('auth.access')} title={t('auth.welcome')} subtitle={emailRegistrationEnabled ? t('auth.loginSubtitle') : t('auth.oauthOnlySubtitle')}>
    {emailRegistrationEnabled && <><form onSubmit={(event) => void submit(event)} className="space-y-4">
      <FormField label={t('auth.email')} name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <FormField label={t('auth.password')} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} trailing={<button type="button" onClick={() => setShowPassword((current) => !current)} className="password-toggle focus-ring" aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
      <div className="flex justify-end"><Link to="/forgot-password" className="focus-ring rounded-gold-sm text-sm text-zinc-500 hover:text-cyan-signal">{t('auth.forgot')}</Link></div>
      <FormError message={error} />
      <button disabled={busy} aria-busy={busy} className="primary-button flex w-full items-center justify-center gap-2">{busy && <LoaderCircle size={16} className="animate-spin" />}{busy ? t('auth.signingIn') : t('auth.login')}</button>
    </form><AuthDivider label={t('auth.or')} /></>}
    <div className="space-y-3">
      <GitHubAuthLink label={t('auth.github')} />
      <LinuxDOAuthLink label={t('auth.linuxDO')} />
    </div>
    <p className="mt-6 text-center text-sm text-zinc-500">{t('auth.noAccount')} <Link to="/register" className="focus-ring rounded-gold-sm font-medium text-cyan-signal hover:text-blue-soft">{t('auth.register')}</Link></p>
  </AuthCard>
}
