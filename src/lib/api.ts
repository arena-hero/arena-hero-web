import type { APIKeyView, AuthOptions, CommandPlan, PlayerStats, Receipt, Session, User } from './types'

export class APIError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message?: string,
  ) {
    super(message || code)
  }
}

const csrfKey = 'arena-hero.csrf'

export const getCSRF = () => localStorage.getItem(csrfKey) ?? ''
export const setCSRF = (token: string) => localStorage.setItem(csrfKey, token)
export const clearCSRF = () => localStorage.removeItem(csrfKey)

export function apiURL(path: string, baseURL = import.meta.env.VITE_API_BASE_URL ?? '') {
  return `${baseURL.trim().replace(/\/+$/, '')}${path}`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(apiURL(path), { ...init, headers, credentials: 'include' })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string; message?: string }
    throw new APIError(body.error ?? 'REQUEST_FAILED', response.status, body.message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  authOptions: () => request<AuthOptions>('/api/v1/auth/options'),
  me: () => request<User>('/api/v1/me'),
  login: async (email: string, password: string) => {
    const session = await request<Session>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setCSRF(session.csrf_token)
    return session
  },
  register: (email: string, username: string, password: string) =>
    request<{ accepted: boolean; message: string }>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password }) }),
  verifyEmail: (token: string) => request<void>('/api/v1/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: (email: string) => request<{ accepted: boolean }>('/api/v1/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) => request<{ accepted: boolean }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<void>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  completeOAuthSignup: (provider: 'github' | 'linux-do', signupToken: string, username: string) =>
    request<Session>(`/api/v1/auth/${provider}/complete`, {
      method: 'POST',
      body: JSON.stringify({ signup_token: signupToken, username }),
    }),
  startGitHubLink: () => request<{ authorization_url: string }>('/api/v1/auth/github/link/start', {
    method: 'POST',
    headers: { 'X-CSRF-Token': getCSRF() },
  }),
  logout: async () => {
    await request<void>('/api/v1/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': getCSRF() } })
    clearCSRF()
  },
  stats: () => request<PlayerStats>('/api/v1/me/stats'),
  apiKeys: async () => (await request<{ api_keys: APIKeyView[] }>('/api/v1/me/api-keys')).api_keys,
  createAPIKey: (name?: string) => request<APIKeyView>('/api/v1/me/api-keys', {
    method: 'POST',
    headers: { 'X-CSRF-Token': getCSRF() },
    body: JSON.stringify(name?.trim() ? { name: name.trim() } : {}),
  }),
  revokeAPIKey: (id: string) => request<void>(`/api/v1/me/api-keys/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': getCSRF() } }),
  submitCommands: (plan: CommandPlan) => request<Receipt>('/api/v1/game/commands', {
    method: 'POST',
    headers: { 'X-CSRF-Token': getCSRF(), 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(plan),
  }),
}
