import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import '../lib/i18n'
import { AccountMenu } from './AccountMenu'

const authState = vi.hoisted(() => ({
  user: { username: 'pilot', email: 'pilot@example.com', auth_source: 'MANUAL' as const, oauth_providers: [] as Array<'github' | 'linux_do'> },
  refresh: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, loading: false, refresh: authState.refresh, login: vi.fn(), logout: vi.fn() }),
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
    authState.user.oauth_providers = []
    authState.refresh.mockReset()
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/arena']}><AccountMenu /></MemoryRouter>)
    const accountButton = screen.getByRole('button', { name: 'Account' })
    expect(accountButton).toHaveTextContent('pilot')
    await user.click(accountButton)
    expect(screen.getByRole('menuitem', { name: 'Arena' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Training' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Documentation' })).toHaveAttribute('href', 'https://doc.arenahero.io/')
    expect(screen.getByRole('menuitem', { name: 'Documentation' })).toHaveAttribute('target', '_blank')
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
    window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: 'arena-hero:github-linked' } }))
    expect(authState.refresh).toHaveBeenCalledOnce()
  })

  it('does not offer GitHub linking when GitHub is already connected', async () => {
    authState.user.oauth_providers = ['github']
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/arena']}><AccountMenu /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Account' }))
    expect(screen.queryByRole('menuitem', { name: 'Link GitHub' })).not.toBeInTheDocument()
  })
})
