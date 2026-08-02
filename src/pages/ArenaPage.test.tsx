import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '../lib/i18n'
import { ArenaPage } from './ArenaPage'

const game = vi.hoisted(() => ({
  tick: 42,
  state: {
    status: 'ACTIVE' as const,
    resources: 8,
    population: 2,
    population_tier: 0,
    upkeep_next_tick: 0,
    champion_beacon: { position: [0, 0] as [number, number] },
    objects: [
      { kind: 'CORE' as const, id: 'core', controlled: true, position: [0, 0] as [number, number], hp: 5, shield: 5, state: 'NORMAL' as const },
      { kind: 'UNIT' as const, id: 'worker', controlled: true, position: [12, -7] as [number, number], hp: 2, unit_type: 'WORKER' as const, cargo: 0 },
    ],
    events: [],
  },
  explored: new Map(),
  phase: 'open' as const,
  stateReceivedAt: Date.now(),
  receipts: {},
  submit: vi.fn(),
  error: null,
}))

vi.mock('../hooks/useGameStream', () => ({ useGameStream: () => game }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'player' } }) }))
vi.mock('../components/game/WorldCanvas', () => ({
  WorldCanvas: ({ centerPosition, centerRequest }: { centerPosition?: [number, number] | null; centerRequest: number }) => <div
    data-testid="world-canvas"
    data-center-position={centerPosition ? JSON.stringify(centerPosition) : ''}
    data-center-request={centerRequest}
  />,
}))

describe('ArenaPage asset selection', () => {
  it('centers the map on a Unit selected from the asset list', async () => {
    render(<ArenaPage demo />)
    const map = screen.getByTestId('world-canvas')
    expect(map).toHaveAttribute('data-center-position', '')
    expect(map).toHaveAttribute('data-center-request', '0')

    await userEvent.click(screen.getByText('Worker'))

    expect(map).toHaveAttribute('data-center-position', '[12,-7]')
    expect(map).toHaveAttribute('data-center-request', '1')
  })
})
