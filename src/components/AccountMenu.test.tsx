import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import '../lib/i18n'
import { AccountMenu } from './AccountMenu'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'pilot', email: 'pilot@example.com', auth_source: 'MANUAL' }, loading: false, refresh: vi.fn(), login: vi.fn(), logout: vi.fn() }),
}))

vi.mock('../lib/api', () => ({
  api: {
    stats: vi.fn().mockResolvedValue({ damage_dealt: 1, damage_received: 2, unit_destruction_participations: 3, core_destruction_participations: 4, resources_harvested: 5, resources_deposited: 6, units_spawned: 7, units_lost: 8, core_survival_ticks: 9, respawn_count: 10 }),
    apiKeys: vi.fn().mockResolvedValue([]),
    createAPIKey: vi.fn(),
    revokeAPIKey: vi.fn(),
  },
}))

describe('AccountMenu', () => {
  it('opens account tools as dialogs without navigating away', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/arena']}><AccountMenu /></MemoryRouter>)
    const accountButton = screen.getByRole('button', { name: 'Account' })
    expect(accountButton).toHaveTextContent('pilot')
    await user.click(accountButton)
    expect(screen.getByRole('menuitem', { name: 'Arena' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Documentation' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('button', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Statistics' }))
    expect(await screen.findByRole('dialog', { name: 'Operator statistics' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(accountButton)
    await user.click(screen.getByRole('menuitem', { name: 'API Keys' }))
    expect(await screen.findByRole('dialog', { name: 'API keys' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(accountButton)
    await user.click(screen.getByRole('menuitem', { name: 'Link GitHub' }))
    expect(await screen.findByRole('dialog', { name: 'Link GitHub' })).toBeInTheDocument()
  })
})
