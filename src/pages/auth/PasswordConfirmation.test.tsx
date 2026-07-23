import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../../lib/api'
import i18n from '../../lib/i18n'
import { RegisterPage } from './RegisterPage'
import { ResetPasswordPage } from './ResetPasswordPage'

describe('password confirmation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    void i18n.changeLanguage('en')
  })

  it('requires matching passwords when registering', async () => {
    vi.spyOn(api, 'authOptions').mockResolvedValue({ email_registration_enabled: true })
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    await user.type(await screen.findByLabelText('Email'), 'player@example.com')
    await user.type(screen.getByLabelText('Username'), 'player_one')
    await user.type(screen.getByLabelText('Password'), 'correct-horse-1')
    await user.type(screen.getByLabelText('Confirm password'), 'correct-horse-2')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('The two passwords do not match.')
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('asks for the password twice when resetting it', () => {
    render(<MemoryRouter initialEntries={['/reset-password?token=test']}><ResetPasswordPage /></MemoryRouter>)
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('autocomplete', 'new-password')
  })
})
