import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard, FormError, FormField } from '../../components/auth/AuthCard'
import { api, APIError, setCSRF } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'

type OAuthProvider = 'github' | 'linux-do'

export function OAuthPage({ provider }: { provider: OAuthProvider }) {
  const { t } = useTranslation(); const navigate = useNavigate(); const fragment = location.hash.slice(1); const params = new URLSearchParams(fragment); const signupToken = params.get('signup_token'); const success = params.get('success') === '1'; const csrf = params.get('csrf_token'); const callbackError = params.get('error')
  const isGitHub = provider === 'github'
  const [username, setUsername] = useState(params.get('username') ?? ''); const [error, setError] = useState(callbackError ? getErrorMessage(callbackError) : ''); const [busy, setBusy] = useState(success)
  useEffect(() => {
    if (csrf) setCSRF(csrf)
    if (!success) return
    void api.me().then(() => {
      if (isGitHub && window.opener) {
        window.opener.postMessage({ type: 'arena-hero:github-linked' }, window.location.origin)
        window.close()
      } else {
        navigate('/arena', { replace: true })
      }
    }).catch(() => setError(getErrorMessage(isGitHub ? 'GITHUB_OAUTH_FAILED' : 'LINUX_DO_OAUTH_FAILED'))).finally(() => setBusy(false))
  }, [csrf, isGitHub, navigate, success])
  const complete = async () => { if (!signupToken) return; setBusy(true); try { const session = await fetch(`/api/v1/auth/${provider}/complete`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signup_token: signupToken, username }) }).then(async (response) => { if (!response.ok) { const body = await response.json(); throw new APIError(body.error, response.status, body.message) } return response.json() }); setCSRF(session.csrf_token); navigate('/arena') } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  return <AuthCard eyebrow={t(isGitHub ? 'auth.githubAccess' : 'auth.linuxDOAccess')} title={signupToken ? t('auth.create') : t(isGitHub ? 'auth.github' : 'auth.linuxDO')}>
    {busy && <LoaderCircle className="mx-auto animate-spin text-cyan-signal" />}
    {!busy && signupToken && <div className="space-y-4"><FormField label={t('auth.username')} name="username" pattern="[a-z0-9_]{3,24}" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} /><FormError message={error} /><button onClick={() => void complete()} className="primary-button w-full">{t('auth.register')}</button></div>}
    {!busy && !signupToken && error && <><FormError message={error} /><Link className="secondary-button mt-4 flex items-center justify-center" to="/login">{t('auth.back')}</Link></>}
  </AuthCard>
}

export function GitHubPage() {
  return <OAuthPage provider="github" />
}

export function LinuxDOPage() {
  return <OAuthPage provider="linux-do" />
}
