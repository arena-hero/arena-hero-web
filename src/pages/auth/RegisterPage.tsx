import { LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AuthCard, AuthDivider, FormError, FormField, GitHubAuthLink, LinuxDOAuthLink } from '../../components/auth/AuthCard'
import { useEmailRegistrationEnabled } from '../../hooks/useAuthOptions'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'
import { USERNAME_PATTERN_SOURCE } from '../../lib/username'

export function RegisterPage() {
  const { t } = useTranslation(); const [values, setValues] = useState({ email: '', username: '', password: '', confirmPassword: '' }); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false)
  const emailRegistrationEnabled = useEmailRegistrationEnabled()
  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); if (values.password !== values.confirmPassword) { setError(t('auth.passwordMismatch')); return } setBusy(true); try { await api.register(values.email, values.username, values.password); setSent(true) } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow={t('auth.newOperator')} title={t('auth.create')} subtitle={emailRegistrationEnabled ? t('auth.usernameHelp') : t('auth.oauthRegistrationSubtitle')}>
    {sent && emailRegistrationEnabled ? <div><div className="rounded-gold-lg border border-green-resource/20 bg-green-resource/5 p-5 text-sm leading-6 text-green-resource">{t('auth.verificationSent')}</div><button onClick={() => void api.resendVerification(values.email)} className="secondary-button mt-3 w-full">{t('auth.resend')}</button></div> : <>
      {emailRegistrationEnabled && <><form onSubmit={(event) => void submit(event)} className="space-y-4">
        <FormField label={t('auth.email')} name="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => update('email', event.target.value)} />
        <FormField label={t('auth.username')} name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required minLength={3} maxLength={24} pattern={USERNAME_PATTERN_SOURCE} placeholder={t('auth.usernamePlaceholder')} hint={t('auth.usernameHelp')} value={values.username} onChange={(event) => update('username', event.target.value.toLowerCase())} />
        <FormField label={t('auth.password')} name="password" type="password" autoComplete="new-password" required minLength={12} value={values.password} onChange={(event) => update('password', event.target.value)} />
        <FormField label={t('auth.confirmPassword')} name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} aria-invalid={Boolean(error) && values.password !== values.confirmPassword} value={values.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} />
        <FormError message={error} /><button disabled={busy} className="primary-button flex w-full items-center justify-center gap-2">{busy && <LoaderCircle size={16} className="animate-spin" />}{t('auth.register')}</button>
      </form><AuthDivider label={t('auth.or')} /></>}
      <div className="space-y-3">
        <GitHubAuthLink label={t('auth.github')} />
        <LinuxDOAuthLink label={t('auth.linuxDO')} />
      </div>
    </>}
    <p className="mt-6 text-center text-sm text-zinc-500">{t('auth.hasAccount')} <Link to="/login" className="text-cyan-signal">{t('auth.login')}</Link></p>
  </AuthCard>
}
