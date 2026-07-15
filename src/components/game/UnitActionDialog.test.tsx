import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import { UnitActionDialog } from './UnitActionDialog'

const selected = { kind: 'UNIT' as const, id: 'worker', controlled: true, position: [0, 0] as [number, number], hp: 2, unit_type: 'WORKER' as const, cargo: 0 }
const plan = { tick: 1, unit_actions: {} }

describe('UnitActionDialog', () => {
  it('disables actions that are not currently available', () => {
    render(<UnitActionDialog anchor={{ x: 100, y: 100, side: 'right' }} selected={selected} plan={plan} phase="open" resources={0} availability={{ actions: { MOVE: true, HARVEST: false, DEPOSIT: false, WAIT: true }, spawns: { WORKER: false, VANGUARD: false, RANGER: false } }} onClose={() => undefined} onTargeting={() => undefined} onSweepTargeting={() => undefined} onMoveTargeting={() => undefined} onUnitAction={() => undefined} onCoreAction={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Harvest' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Hold' })).not.toBeInTheDocument()
  })

  it('closes after choosing a complete immediate action', async () => {
    const user = userEvent.setup(); const onClose = vi.fn(); const onUnitAction = vi.fn()
    render(<UnitActionDialog anchor={{ x: 100, y: 100, side: 'right' }} selected={selected} plan={plan} phase="open" resources={0} availability={{ actions: { MOVE: true, HARVEST: true, DEPOSIT: false, WAIT: true }, spawns: { WORKER: false, VANGUARD: false, RANGER: false } }} onClose={onClose} onTargeting={() => undefined} onSweepTargeting={() => undefined} onMoveTargeting={() => undefined} onUnitAction={onUnitAction} onCoreAction={() => undefined} />)
    await user.click(screen.getByRole('button', { name: 'Harvest' }))
    expect(onUnitAction).toHaveBeenCalledWith('worker', { type: 'HARVEST' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Core production choices and their costs even when unavailable', () => {
    const core = { kind: 'CORE' as const, id: 'core', controlled: true, position: [1, 1] as [number, number], hp: 20, shield: 20, state: 'NORMAL' as const }
    render(<UnitActionDialog anchor={{ x: 100, y: 100, side: 'right' }} selected={core} plan={plan} phase="open" resources={4} availability={{ actions: { REPAIR_SHIELD: false, START_MOVE: true, WAIT: true }, spawns: { WORKER: false, VANGUARD: false, RANGER: false } }} onClose={() => undefined} onTargeting={() => undefined} onSweepTargeting={() => undefined} onMoveTargeting={() => undefined} onUnitAction={() => undefined} onCoreAction={() => undefined} />)
    expect(screen.getByText('Produce unit')).toBeInTheDocument()
    expect(screen.getByText('4 available')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Worker · 5 resources' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Vanguard · 10 resources' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ranger · 12 resources' })).toBeDisabled()
  })

  it('submits a selected Core production order immediately', async () => {
    const user = userEvent.setup(); const onClose = vi.fn(); const onCoreAction = vi.fn()
    const core = { kind: 'CORE' as const, id: 'core', controlled: true, position: [1, 1] as [number, number], hp: 20, shield: 20, state: 'NORMAL' as const }
    render(<UnitActionDialog anchor={{ x: 100, y: 100, side: 'right' }} selected={core} plan={plan} phase="open" resources={5} availability={{ actions: { REPAIR_SHIELD: false, START_MOVE: true, WAIT: true }, spawns: { WORKER: true, VANGUARD: false, RANGER: false } }} onClose={onClose} onTargeting={() => undefined} onSweepTargeting={() => undefined} onMoveTargeting={() => undefined} onUnitAction={() => undefined} onCoreAction={onCoreAction} />)
    await user.click(screen.getByRole('button', { name: 'Worker · 5 resources' }))
    expect(onCoreAction).toHaveBeenCalledWith({ type: 'SPAWN', unit_type: 'WORKER' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
