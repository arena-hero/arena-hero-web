import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AuthCard, FormError, FormField } from '../../components/auth/AuthCard'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'

export function ForgotPasswordPage() {
  const { t } = useTranslation(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { await api.forgotPassword(email); setSent(true) } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow={t('auth.recovery')} title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
    {sent ? <div className="rounded-gold border border-green-resource/20 bg-green-resource/5 p-4 text-sm text-green-resource">{t('auth.verificationSent')}</div> : <form onSubmit={(event) => void submit(event)} className="space-y-4"><FormField label={t('auth.email')} name="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><FormError message={error} /><button disabled={busy} className="primary-button w-full">{t('auth.sendReset')}</button></form>}
    <Link to="/login" className="mt-6 block text-center text-sm text-zinc-500 hover:text-cyan-signal">{t('auth.back')}</Link>
  </AuthCard>
}
