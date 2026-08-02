import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
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
      { kind: 'UNIT' as const, id: 'ranger', controlled: true, position: [0, 0] as [number, number], hp: 2, unit_type: 'RANGER' as const },
      { kind: 'UNIT' as const, id: 'high', controlled: false, position: [3, 1] as [number, number], hp: 4, unit_type: 'VANGUARD' as const },
      { kind: 'UNIT' as const, id: 'low', controlled: false, position: [4, 0] as [number, number], hp: 1, unit_type: 'WORKER' as const },
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
  WorldCanvas: ({ centerPosition, centerRequest, selectedId, attackPositions = [], onAttackPosition, onAnchorChange }: { centerPosition?: [number, number] | null; centerRequest: number; selectedId: string | null; attackPositions?: [number, number][]; onAttackPosition?: (position: [number, number]) => void; onAnchorChange: (anchor: { x: number; y: number; side: 'right' } | null) => void }) => {
    useEffect(() => { onAnchorChange(selectedId ? { x: 100, y: 100, side: 'right' } : null) }, [onAnchorChange, selectedId])
    return <div
        data-testid="world-canvas"
        data-center-position={centerPosition ? JSON.stringify(centerPosition) : ''}
        data-center-request={centerRequest}
      >
        {attackPositions.some(([x, y]) => x === 3 && y === 0) && <button type="button" onClick={() => onAttackPosition?.([3, 0])}>Attack predicted cell</button>}
      </div>
  },
}))

describe('ArenaPage asset selection', () => {
  beforeEach(() => game.submit.mockReset())

  it('centers the map on a Unit selected from the asset list', async () => {
    render(<ArenaPage demo />)
    const map = screen.getByTestId('world-canvas')
    expect(map).toHaveAttribute('data-center-position', '')
    expect(map).toHaveAttribute('data-center-request', '0')

    await userEvent.click(screen.getByText('Worker'))

    expect(map).toHaveAttribute('data-center-position', '[12,-7]')
    expect(map).toHaveAttribute('data-center-request', '1')
  })

  it('submits a predicted Ranger cell using the lowest-HP possible target', async () => {
    const user = userEvent.setup()
    render(<ArenaPage demo />)

    await user.click(screen.getByText('Ranger'))
    await user.click(screen.getByRole('button', { name: 'Shoot' }))
    await user.click(screen.getByRole('button', { name: 'Attack predicted cell' }))

    await waitFor(() => expect(game.submit).toHaveBeenCalledWith({
      tick: 42,
      unit_actions: { ranger: { type: 'SHOOT', target_id: 'low', expected_cell: [3, 0] } },
    }))
  })
})
