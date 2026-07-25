import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { api } from '../../lib/api'
import i18n from '../../lib/i18n'
import { LoginPage } from './LoginPage'

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: vi.fn() }) }))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.spyOn(api, 'authOptions').mockResolvedValue({ email_registration_enabled: false })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    void i18n.changeLanguage('en')
  })

  it('lets the operator reveal and hide the password', async () => {
    vi.mocked(api.authOptions).mockResolvedValue({ email_registration_enabled: true })
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    const password = await screen.findByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })

  it('offers OAuth only when email registration is disabled', () => {
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)

    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Forgot password?' })).not.toBeInTheDocument()
    const github = screen.getByRole('link', { name: 'Continue with GitHub' })
    const linuxDO = screen.getByRole('link', { name: 'Continue with LINUX DO' })
    expect(linuxDO).toHaveAttribute('href', '/api/v1/auth/linux-do/start')
    expect(linuxDO).toHaveStyle({ backgroundColor: '#FFB001' })
    expect(linuxDO.querySelector('svg, img, .linux-do-mark')).not.toBeInTheDocument()
    expect(github).toHaveAttribute('href', '/api/v1/auth/github/start')
    expect(github.compareDocumentPosition(linuxDO) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelector('.github-logo')).toBeInTheDocument()
    expect(container.querySelector('.lucide-git-fork')).not.toBeInTheDocument()
  })
})
