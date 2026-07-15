import { APIError } from './api'
import i18n from './i18n'

const ERROR_KEYS = {
  EMAIL_NOT_VERIFIED: 'errors.emailNotVerified',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  IDENTITY_ALREADY_EXISTS: 'errors.identityAlreadyExists',
  REGISTRATION_FAILED: 'errors.registrationFailed',
  INVALID_OR_EXPIRED_TOKEN: 'errors.invalidOrExpiredToken',
  PASSWORD_RESET_FAILED: 'errors.passwordResetFailed',
  GITHUB_OAUTH_NOT_CONFIGURED: 'errors.githubUnavailable',
  OAUTH_STATE_INVALID: 'errors.oauthFailed',
  OAUTH_LINK_REQUIRED: 'errors.oauthLinkRequired',
  GITHUB_OAUTH_FAILED: 'errors.oauthFailed',
  GITHUB_SIGNUP_FAILED: 'errors.oauthFailed',
  UNAUTHORIZED: 'errors.sessionExpired',
  WEB_SESSION_REQUIRED: 'errors.sessionExpired',
  CSRF_INVALID: 'errors.sessionExpired',
  API_KEY_CREATE_FAILED: 'errors.apiKeyFailed',
  API_KEY_NOT_FOUND: 'errors.apiKeyNotFound',
  STATS_UNAVAILABLE: 'errors.statsUnavailable',
  COMMAND_WINDOW_CLOSED: 'errors.commandWindowClosed',
  TICK_MISMATCH: 'errors.tickMismatch',
  INVALID_COMMAND: 'errors.invalidCommand',
  COMMAND_SUPERSEDED: 'errors.commandSuperseded',
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
