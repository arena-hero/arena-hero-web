import { APIError } from './api'
import i18n from './i18n'

const ERROR_KEYS = {
  EMAIL_NOT_VERIFIED: 'errors.emailNotVerified',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  LOGIN_RATE_LIMITED: 'errors.loginRateLimited',
  IDENTITY_ALREADY_EXISTS: 'errors.identityAlreadyExists',
  REGISTRATION_FAILED: 'errors.registrationFailed',
  EMAIL_REGISTRATION_DISABLED: 'errors.emailRegistrationDisabled',
  INVALID_OR_EXPIRED_TOKEN: 'errors.invalidOrExpiredToken',
  PASSWORD_RESET_FAILED: 'errors.passwordResetFailed',
  GITHUB_OAUTH_NOT_CONFIGURED: 'errors.githubUnavailable',
  OAUTH_STATE_INVALID: 'errors.oauthFailed',
  OAUTH_LINK_REQUIRED: 'errors.oauthLinkRequired',
  GITHUB_OAUTH_FAILED: 'errors.oauthFailed',
  GITHUB_SIGNUP_FAILED: 'errors.oauthFailed',
  LINUX_DO_OAUTH_NOT_CONFIGURED: 'errors.linuxDOUnavailable',
  LINUX_DO_OAUTH_FAILED: 'errors.linuxDOOAuthFailed',
  LINUX_DO_SIGNUP_FAILED: 'errors.linuxDOOAuthFailed',
  UNAUTHORIZED: 'errors.sessionExpired',
  WEB_SESSION_REQUIRED: 'errors.sessionExpired',
  CSRF_INVALID: 'errors.sessionExpired',
  API_KEY_CREATE_FAILED: 'errors.apiKeyFailed',
  API_KEY_LIMIT_REACHED: 'errors.apiKeyLimit',
  API_KEY_NOT_FOUND: 'errors.apiKeyNotFound',
  STATS_UNAVAILABLE: 'errors.statsUnavailable',
  COMMAND_WINDOW_CLOSED: 'errors.commandWindowClosed',
  COMMAND_CONCURRENCY_LIMIT: 'errors.commandConcurrencyLimit',
  TICK_MISMATCH: 'errors.tickMismatch',
  INVALID_COMMAND: 'errors.invalidCommand',
  IDEMPOTENCY_CONFLICT: 'errors.commandConflict',
  PLAYER_NOT_READY: 'errors.playerNotReady',
  STATE_INVALID: 'errors.stateInvalid',
  REQUEST_FAILED: 'errors.generic',
  INTERNAL_ERROR: 'errors.generic',
} as const

export function getErrorMessage(cause: unknown, fallbackCode = 'REQUEST_FAILED') {
  const code = cause instanceof APIError ? cause.code : typeof cause === 'string' ? cause : fallbackCode
  const key = ERROR_KEYS[code as keyof typeof ERROR_KEYS] ?? 'errors.generic'
  return i18n.t(key)
}
