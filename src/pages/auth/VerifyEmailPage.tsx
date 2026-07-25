import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { AuthCard } from '../../components/auth/AuthCard'
import { api } from '../../lib/api'

export function VerifyEmailPage() {
  const { t } = useTranslation(); const [params, setParams] = useSearchParams(); const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? params.get('token') ?? ''); const [status, setStatus] = useState<'busy' | 'done' | 'error'>('busy')
  useEffect(() => {
    if (params.has('token')) { const scrubbed = new URLSearchParams(params); scrubbed.delete('token'); setParams(scrubbed, { replace: true }) }
    if (new URLSearchParams(window.location.hash.slice(1)).has('token')) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [params, setParams])
  useEffect(() => { if (!token) { setStatus('error'); return } void api.verifyEmail(token).then(() => setStatus('done')).catch(() => setStatus('error')) }, [token])
  return <AuthCard eyebrow={t('auth.identityCheck')} title={t('auth.verifyTitle')}>
    <div className="flex flex-col items-center py-6 text-center">
      {status === 'busy' && <><LoaderCircle className="mb-4 animate-spin text-cyan-signal" /><p className="text-zinc-400">{t('auth.verifying')}</p></>}
      {status === 'done' && <><CheckCircle2 className="mb-4 text-green-resource" size={34} /><p className="max-w-sm text-sm leading-6 text-zinc-300">{t('auth.verified')}</p><Link to="/login" className="primary-button mt-6 inline-flex items-center">{t('auth.login')}</Link></>}
      {status === 'error' && <><XCircle className="mb-4 text-coral-hostile" size={34} /><p role="alert" className="text-sm leading-6 text-coral-hostile">{t('errors.invalidOrExpiredToken')}</p><Link to="/login" className="secondary-button mt-6 inline-flex items-center">{t('auth.back')}</Link></>}
    </div>
  </AuthCard>
}
