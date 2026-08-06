import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { ResourceActivity } from './ResourceActivity'

describe('ResourceActivity', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('shows Core self-destruction at the resolved position', () => {
    render(<ResourceActivity events={[{
      event_id: 'core-self-destruct', tick: 8, event_type: 'CORE_DESTROYED', reason_code: 'SELF_DESTRUCT', position: [2, 3],
    }]} />)
    expect(screen.getByText('Core self-destructed. Its inventory and fleet were lost.')).toBeInTheDocument()
    expect(screen.getByText('[2, 3]')).toBeInTheDocument()
  })

  it('shows cargo drops, recovery, and destroyed overflow with positions', () => {
    render(<ResourceActivity events={[
      {
        event_id: 'drop',
        tick: 8,
        event_type: 'WORKER_CARGO_DROPPED',
        position: [4, 5],
        values: { amount: 2 },
      },
      {
        event_id: 'recover',
        tick: 8,
        event_type: 'HARVEST_SUCCEEDED',
        position: [7, 8],
        values: { amount: 1, source: 'DROPPED_CARGO' },
      },
      {
        event_id: 'overflow',
        tick: 8,
        event_type: 'CORE_RESOURCE_OVERFLOW_DESTROYED',
        position: [0, 0],
        values: { amount: 5, capacity: 10 },
      },
    ]} />)

    expect(screen.getByText('Worker dropped 2 resources')).toBeInTheDocument()
    expect(screen.getByText('Recovered 1 dropped resource')).toBeInTheDocument()
    expect(screen.getByText('Destroyed 5 excess Core resources')).toBeInTheDocument()
    expect(screen.getByText('[4, 5]')).toBeInTheDocument()
    expect(screen.getByText('[7, 8]')).toBeInTheDocument()
    expect(screen.getByText('[0, 0]')).toBeInTheDocument()
  })

  it('uses Chinese copy and ignores natural harvests', async () => {
    await i18n.changeLanguage('zh')
    const { rerender } = render(<ResourceActivity events={[
      {
        event_id: 'natural',
        tick: 8,
        event_type: 'HARVEST_SUCCEEDED',
        position: [1, 2],
        values: { amount: 1, source: 'RESOURCE_NODE' },
      },
    ]} />)
    expect(screen.queryByLabelText('资源变动')).not.toBeInTheDocument()

    rerender(<ResourceActivity events={[{
      event_id: 'drop',
      tick: 8,
      event_type: 'WORKER_CARGO_DROPPED',
      position: [1, 2],
      values: { amount: 2 },
    }]} />)
    expect(screen.getByText('Worker 掉落了 2 点资源')).toBeInTheDocument()
  })

  it('explains captured and destroyed Core resources', () => {
    render(<ResourceActivity events={[{
    event_id: 'capture',
    tick: 8,
    event_type: 'CORE_RESOURCES_CAPTURED',
    position: [5, 6],
    values: { amount: 1, available: 6, destroyed: 5, capacity: 10 },
    }]} />)
    expect(screen.getByText('Captured 1 of 6 Core resources. 5 did not fit and was destroyed (capacity 10).')).toBeInTheDocument()
    expect(screen.getByText('[5, 6]')).toBeInTheDocument()
  })

  it('shows the Core limit when any client attempts a full deposit', () => {
    render(<ResourceActivity events={[{
      event_id: 'full',
      tick: 8,
      event_type: 'DEPOSIT_FAILED',
      reason_code: 'CORE_RESOURCE_FULL',
      position: [0, 0],
      values: { capacity: 15 },
    }]} />)
    expect(screen.getByText('Resource storage is full. Capacity is at least 10, then population × 5 (currently 15).')).toBeInTheDocument()
    expect(screen.getByText('[0, 0]')).toBeInTheDocument()
  })

  it('explains a deposit rejected because the Core started moving', () => {
    render(<ResourceActivity events={[{
      event_id: 'moving',
      tick: 8,
      event_type: 'DEPOSIT_FAILED',
      reason_code: 'CORE_MOVING',
      position: [0, 0],
    }]} />)
    expect(screen.getByText('Deposit failed: the Core started moving this Tick.')).toBeInTheDocument()
  })
})
