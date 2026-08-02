import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import i18n from '../lib/i18n'
import { api } from '../lib/api'
import { LeaderboardPage } from './LeaderboardPage'

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../lib/api', () => ({ api: { leaderboard: vi.fn() } }))

const leaderboard = {
  beacon_ticks_held: [
    { rank: 1, username: 'alpha', score: 120 },
    { rank: 2, username: 'beta', score: 80 },
  ],
  damage_dealt: [{ rank: 1, username: 'ranger', score: 4500 }],
  core_destruction_participations: [{ rank: 1, username: 'vanguard', score: 7 }],
}

describe('LeaderboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
    void i18n.changeLanguage('en')
  })

  it('shows exactly the three lifetime rankings and public account names', async () => {
    vi.mocked(api.leaderboard).mockResolvedValue(leaderboard)
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)

    expect(await screen.findByText('@alpha')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Beacon ticks held' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Damage dealt' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Core destruction participations' })).toBeInTheDocument()
    expect(screen.getByText('4,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
  })

  it('lets mobile users select a ranking', async () => {
    vi.mocked(api.leaderboard).mockResolvedValue(leaderboard)
    const user = userEvent.setup()
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)

    await screen.findByText('@alpha')
    const damageTab = screen.getByRole('tab', { name: 'Damage dealt' })
    await user.click(damageTab)
    expect(damageTab).toHaveAttribute('aria-selected', 'true')
  })

  it('offers a retry when the initial request fails', async () => {
    vi.mocked(api.leaderboard).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(leaderboard)
    const user = userEvent.setup()
    render(<MemoryRouter><LeaderboardPage /></MemoryRouter>)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The leaderboard is temporarily unavailable.')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('@alpha')).toBeInTheDocument())
  })
})
