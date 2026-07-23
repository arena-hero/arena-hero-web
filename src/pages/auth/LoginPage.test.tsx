import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../../lib/i18n'
import { LoginPage } from './LoginPage'

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: vi.fn() }) }))

describe('LoginPage', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('lets the operator reveal and hide the password', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })
})
