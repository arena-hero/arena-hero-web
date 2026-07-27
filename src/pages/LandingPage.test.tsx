import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import i18n from '../lib/i18n'
import { LandingPage } from './LandingPage'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))

describe('LandingPage', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('introduces the real game and directs new players to registration', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Make your mark on an infinite battlefield.' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Create account' })[0]).toHaveAttribute('href', '/register')
    expect(screen.getByAltText('Arena Hero tactical map with units, resources, and obstacles')).toHaveAttribute('src', '/assets/marketing/arena-gameplay.jpg')
    expect(screen.getByText('/api/v1/game/commands')).toBeInTheDocument()
  })
})
