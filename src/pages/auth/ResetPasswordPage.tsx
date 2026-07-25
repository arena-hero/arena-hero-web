import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { AuthCard, FormError, FormField } from '../../components/auth/AuthCard'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'

export function ResetPasswordPage() {
  const { t } = useTranslation(); const [params] = useSearchParams(); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return } setBusy(true); try { await api.resetPassword(params.get('token') ?? '', password); setDone(true) } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow={t('auth.newCredential')} title={t('auth.resetTitle')}>
    {done ? <Link to="/login" className="primary-button flex w-full items-center justify-center">{t('auth.login')}</Link> : <form onSubmit={(event) => void submit(event)} className="space-y-4"><FormField label={t('auth.password')} name="password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} /><FormField label={t('auth.confirmPassword')} name="confirmPassword" type="password" autoComplete="new-password" minLength={12} required aria-invalid={Boolean(error) && password !== confirmPassword} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /><FormError message={error} /><button disabled={busy} className="primary-button w-full">{t('auth.reset')}</button></form>}
  </AuthCard>
}
