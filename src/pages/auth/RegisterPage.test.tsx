import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { api } from '../../lib/api'
import i18n from '../../lib/i18n'
import { RegisterPage } from './RegisterPage'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.spyOn(api, 'authOptions').mockResolvedValue({ email_registration_enabled: false })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    void i18n.changeLanguage('en')
  })

  it('hides email registration and offers OAuth account creation', () => {
    const { container } = render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument()
    const github = screen.getByRole('link', { name: 'Continue with GitHub' })
    const linuxDO = screen.getByRole('link', { name: 'Continue with LINUX DO' })
    expect(linuxDO).toHaveAttribute('href', '/api/v1/auth/linux-do/start')
    expect(linuxDO).toHaveStyle({ backgroundColor: '#FFB001' })
    expect(linuxDO.querySelector('svg, img, .linux-do-mark')).not.toBeInTheDocument()
    expect(github).toHaveAttribute('href', '/api/v1/auth/github/start')
    expect(github.compareDocumentPosition(linuxDO) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelector('.github-logo')).toBeInTheDocument()
  })

  it('shows the email form when email registration is enabled', async () => {
    vi.mocked(api.authOptions).mockResolvedValue({ email_registration_enabled: true })
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
  })
})
