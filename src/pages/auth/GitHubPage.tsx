import { LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { AuthCard, FormError, FormField } from '../../components/auth/AuthCard'
import { api, APIError, apiURL, setCSRF } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'
import { isValidUsername, normalizeUsername, USERNAME_PATTERN_SOURCE } from '../../lib/username'

type OAuthProvider = 'github' | 'linux-do'
type UsernameErrorKey = '' | 'errors.usernameRequired' | 'errors.usernameInvalid' | 'errors.usernameTaken'

export function OAuthPage({ provider }: { provider: OAuthProvider }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [fragment] = useState(() => location.hash.slice(1))
  const params = useMemo(() => new URLSearchParams(fragment), [fragment])
  const signupToken = params.get('signup_token')
  const success = params.get('success') === '1'
  const csrf = params.get('csrf_token')
  const callbackError = params.get('error')
  const linkFlow = params.get('link') === '1'
  const isGitHub = provider === 'github'
  const providerStartURL = apiURL(`/api/v1/auth/${provider}/start`)
  const [username, setUsername] = useState(params.get('username') ?? '')
  const [fieldErrorKey, setFieldErrorKey] = useState<UsernameErrorKey>('')
  const [errorCode, setErrorCode] = useState(callbackError ?? (!signupToken && !success ? 'OAUTH_STATE_INVALID' : ''))
  const [busy, setBusy] = useState(success)

  useEffect(() => {
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [])

  useEffect(() => {
    if (csrf) setCSRF(csrf)
    if (!success) return
    void api.me().then(() => {
      if (linkFlow && window.opener) {
        window.opener.postMessage({ type: 'arena-hero:github-linked' }, window.location.origin)
        window.close()
      } else {
        navigate('/arena', { replace: true })
      }
    }).catch(() => setErrorCode(isGitHub ? 'GITHUB_OAUTH_FAILED' : 'LINUX_DO_OAUTH_FAILED')).finally(() => setBusy(false))
  }, [csrf, isGitHub, linkFlow, navigate, success])

  const updateUsername = (value: string) => {
    setUsername(value.toLowerCase())
    setFieldErrorKey('')
    if (errorCode === 'USERNAME_INVALID' || errorCode === 'USERNAME_TAKEN') setErrorCode('')
  }

  const complete = async (event: FormEvent) => {
    event.preventDefault()
    if (!signupToken) return
    const normalized = normalizeUsername(username)
    setUsername(normalized)
    setFieldErrorKey('')
    setErrorCode('')
    if (!normalized) {
      setFieldErrorKey('errors.usernameRequired')
      return
    }
    if (!isValidUsername(normalized)) {
      setFieldErrorKey('errors.usernameInvalid')
      return
    }
    setBusy(true)
    try {
      const session = await api.completeOAuthSignup(provider, signupToken, normalized)
      setCSRF(session.csrf_token)
      navigate('/arena', { replace: true })
    } catch (cause) {
      const code = cause instanceof APIError ? cause.code : 'REQUEST_FAILED'
      if (code === 'USERNAME_INVALID' || code === 'USERNAME_TAKEN') {
        setFieldErrorKey(code === 'USERNAME_TAKEN' ? 'errors.usernameTaken' : 'errors.usernameInvalid')
      } else {
        setErrorCode(code)
      }
    } finally {
      setBusy(false)
    }
  }

  const pageError = errorCode ? getErrorMessage(errorCode) : ''
  const fieldError = fieldErrorKey ? t(fieldErrorKey) : ''
  const canRetryProvider = !linkFlow && errorCode !== 'OAUTH_LINK_REQUIRED'
  const retryLabel = t(isGitHub ? 'auth.tryGitHubAgain' : 'auth.tryLinuxDOAgain')
  const title = signupToken
    ? t('auth.claimUsername')
    : success
      ? t(linkFlow ? 'auth.finishingGitHubLink' : 'auth.signingIn')
      : t(linkFlow ? 'auth.githubLinkIssueTitle' : 'auth.oauthIssueTitle')

  return <AuthCard
    eyebrow={t(isGitHub ? 'auth.githubAccess' : 'auth.linuxDOAccess')}
    title={title}
    subtitle={signupToken ? t('auth.oauthUsernameSubtitle') : undefined}
  >
    {busy && <LoaderCircle className="mx-auto animate-spin text-cyan-signal" />}
    {!busy && signupToken && <form noValidate onSubmit={(event) => void complete(event)} className="space-y-4">
      <FormField
        label={t('auth.username')}
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        minLength={3}
        maxLength={24}
        pattern={USERNAME_PATTERN_SOURCE}
        placeholder={t('auth.usernamePlaceholder')}
        value={username}
        hint={t('auth.usernameHelp')}
        error={fieldError}
        onChange={(event) => updateUsername(event.target.value)}
      />
      <FormError message={pageError} />
      {errorCode === 'OAUTH_SIGNUP_EXPIRED' && <a className="secondary-button flex items-center justify-center" href={providerStartURL}>{retryLabel}</a>}
      <button disabled={busy} className="primary-button flex w-full items-center justify-center gap-2">
        {busy && <LoaderCircle size={16} className="animate-spin" />}
        {t('auth.register')}
      </button>
    </form>}
    {!busy && !signupToken && <div className="space-y-4">
      <FormError message={pageError} />
      {canRetryProvider && <a className="primary-button flex items-center justify-center" href={providerStartURL}>{retryLabel}</a>}
      {linkFlow
        ? <button type="button" className="secondary-button w-full" onClick={() => window.close()}>{t('auth.closeWindow')}</button>
        : <Link className="secondary-button flex items-center justify-center" to="/login">{t('auth.back')}</Link>}
    </div>}
  </AuthCard>
}

export function GitHubPage() {
  return <OAuthPage provider="github" />
}

export function LinuxDOPage() {
  return <OAuthPage provider="linux-do" />
}
