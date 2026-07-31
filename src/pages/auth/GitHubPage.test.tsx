import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import i18n from '../../lib/i18n'
import { APIError } from '../../lib/api'
import { GitHubPage, LinuxDOPage } from './GitHubPage'

const apiMock = vi.hoisted(() => ({
  completeOAuthSignup: vi.fn(),
}))
const authMock = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ refresh: authMock.refresh }),
}))

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api')
  return {
    ...actual,
    api: {
      ...actual.api,
      completeOAuthSignup: apiMock.completeOAuthSignup,
    },
  }
})

describe('GitHubPage', () => {
  beforeEach(async () => {
    apiMock.completeOAuthSignup.mockReset()
    authMock.refresh.mockReset()
    authMock.refresh.mockResolvedValue(true)
    await i18n.changeLanguage('en')
  })

  it('explains the public username rules and rejects unsupported characters locally', async () => {
    window.history.replaceState({}, '', '/auth/github#signup_token=one-time-token')
    const user = userEvent.setup()
    render(<MemoryRouter><GitHubPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Choose your username' })).toBeInTheDocument()
    expect(screen.getByText(/lowercase English letters/)).toBeInTheDocument()
    const username = screen.getByRole('textbox', { name: 'Username' })
    expect(username).toHaveAttribute('maxlength', '24')
    expect(username).toHaveAttribute('placeholder', 'arena_hero')

    await user.type(username, '阿柯')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Use only 3–24 lowercase English letters, numbers, or underscores.')
    expect(apiMock.completeOAuthSignup).not.toHaveBeenCalled()

    await act(() => i18n.changeLanguage('zh'))
    expect(screen.getByRole('alert')).toHaveTextContent('用户名只能包含 3–24 位小写英文字母、数字或下划线。')
  })

  it('shows a username-specific conflict returned by the API', async () => {
    window.history.replaceState({}, '', '/auth/github#signup_token=one-time-token')
    apiMock.completeOAuthSignup.mockRejectedValue(new APIError('USERNAME_TAKEN', 409))
    const user = userEvent.setup()
    render(<MemoryRouter><GitHubPage /></MemoryRouter>)

    await user.type(screen.getByRole('textbox', { name: 'Username' }), 'taken_name')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('That username is already taken. Try another one.')
  })

  it('turns a cancelled provider authorization into a clear retry path', () => {
    window.history.replaceState({}, '', '/auth/github#error=OAUTH_ACCESS_DENIED')
    render(<MemoryRouter><GitHubPage /></MemoryRouter>)

    expect(screen.getByRole('alert')).toHaveTextContent('Authorization was cancelled.')
    expect(screen.getByRole('link', { name: 'Try GitHub again' })).toHaveAttribute('href', '/api/v1/auth/github/start')
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login')
  })

  it('uses a neutral loading title after a successful sign-in callback', () => {
    window.history.replaceState({}, '', '/auth/github#success=1&csrf_token=csrf-token')
    authMock.refresh.mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><GitHubPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Signing in…' })).toBeInTheDocument()
    expect(screen.queryByText('Sign-in needs your attention')).not.toBeInTheDocument()
  })

  it('refreshes the authenticated user before entering the arena after LINUX DO signup', async () => {
    window.history.replaceState({}, '', '/auth/linux-do#signup_token=one-time-token')
    apiMock.completeOAuthSignup.mockResolvedValue({
      csrf_token: 'csrf-token',
      expires_at: '2026-08-01T00:00:00Z',
      username: 'hero',
    })
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/auth/linux-do']}><Routes>
      <Route path="/auth/linux-do" element={<LinuxDOPage />} />
      <Route path="/arena" element={<div>Arena route</div>} />
    </Routes></MemoryRouter>)

    await user.type(screen.getByRole('textbox', { name: 'Username' }), 'hero')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Arena route')).toBeInTheDocument()
    expect(apiMock.completeOAuthSignup).toHaveBeenCalledWith('linux-do', 'one-time-token', 'hero')
    expect(authMock.refresh).toHaveBeenCalledOnce()
  })

  it('keeps GitHub link failures inside the link flow', () => {
    window.history.replaceState({}, '', '/auth/github#error=OAUTH_LINK_SESSION_EXPIRED&link=1')
    render(<MemoryRouter><GitHubPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: "GitHub wasn't linked" })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Close this window and try again from the account menu.')
    expect(screen.getByRole('button', { name: 'Close window' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Try GitHub again' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Back to sign in' })).not.toBeInTheDocument()
  })
})
