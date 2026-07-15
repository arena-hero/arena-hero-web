import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard'
import { api } from '../../lib/api'

export function VerifyEmailPage() {
  const { t } = useTranslation(); const [params] = useSearchParams(); const [status, setStatus] = useState<'busy' | 'done' | 'error'>('busy')
  useEffect(() => { const token = params.get('token'); if (!token) { setStatus('error'); return } void api.verifyEmail(token).then(() => setStatus('done')).catch(() => setStatus('error')) }, [params])
  return <AuthCard eyebrow="IDENTITY HANDSHAKE" title={t('auth.verifyTitle')}>
    <div className="flex flex-col items-center py-6 text-center">
      {status === 'busy' && <><LoaderCircle className="mb-4 animate-spin text-cyan-signal" /><p className="text-zinc-400">{t('auth.verifying')}</p></>}
      {status === 'done' && <><CheckCircle2 className="mb-4 text-green-resource" size={34} /><p className="max-w-sm text-sm leading-6 text-zinc-300">{t('auth.verified')}</p><Link to="/login" className="primary-button mt-6 inline-flex items-center">{t('auth.login')}</Link></>}
      {status === 'error' && <><XCircle className="mb-4 text-coral-hostile" size={34} /><p role="alert" className="text-sm leading-6 text-coral-hostile">{t('errors.invalidOrExpiredToken')}</p><Link to="/login" className="secondary-button mt-6 inline-flex items-center">{t('auth.back')}</Link></>}
    </div>
  </AuthCard>
}
