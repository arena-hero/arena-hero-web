import { describe, expect, it } from 'vitest'
import { resourceActivityFromEvents } from './resourceActivity'

describe('resourceActivityFromEvents', () => {
  it('maps Core self-destruction to a Tick result', () => {
    expect(resourceActivityFromEvents([{
      event_id: 'core-self-destruct', tick: 9, event_type: 'CORE_DESTROYED', reason_code: 'SELF_DESTRUCT', position: [3, 4],
    }])).toEqual([{ eventId: 'core-self-destruct', kind: 'CORE_SELF_DESTRUCT', position: [3, 4] }])
  })

  it('maps healing success and dynamic failures', () => {
    expect(resourceActivityFromEvents([
      { event_id: 'healed', tick: 9, event_type: 'UNIT_HEAL_SUCCEEDED', position: [0, 0], values: { amount: 2, hp: 4, cost: 2 } },
      { event_id: 'failed', tick: 9, event_type: 'CORE_HEAL_FAILED', reason_code: 'INSUFFICIENT_RESOURCES', position: [0, 0] },
    ])).toEqual([
      { eventId: 'healed', kind: 'HEALED', amount: 2, hp: 4, position: [0, 0] },
      { eventId: 'failed', kind: 'HEAL_FAILED', reason: 'INSUFFICIENT_RESOURCES', position: [0, 0] },
    ])
  })

  it('returns cargo drops, recovery, and destroyed Core overflow', () => {
    expect(resourceActivityFromEvents([
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
        position: [4, 5],
        values: { amount: 1, source: 'DROPPED_CARGO' },
      },
      {
        event_id: 'overflow',
        tick: 8,
        event_type: 'CORE_RESOURCE_OVERFLOW_DESTROYED',
        position: [0, 0],
        values: { amount: 5, capacity: 10 },
      },
    ])).toEqual([
      { eventId: 'drop', kind: 'DROPPED', amount: 2, position: [4, 5] },
      { eventId: 'recover', kind: 'RECOVERED', amount: 1, position: [4, 5] },
      { eventId: 'overflow', kind: 'DESTROYED', amount: 5, position: [0, 0] },
    ])
  })

  it('ignores natural harvests and malformed amounts', () => {
    expect(resourceActivityFromEvents([
      {
        event_id: 'natural',
        tick: 8,
        event_type: 'HARVEST_SUCCEEDED',
        position: [1, 2],
        values: { amount: 1, source: 'RESOURCE_NODE' },
      },
      {
        event_id: 'invalid',
        tick: 8,
        event_type: 'WORKER_CARGO_DROPPED',
        position: [1, 2],
        values: { amount: 0 },
      },
    ])).toEqual([])
  })

  it('returns captured Core resources, including a full-storage capture', () => {
    expect(resourceActivityFromEvents([
    {
      event_id: 'capture',
      tick: 8,
      event_type: 'CORE_RESOURCES_CAPTURED',
      position: [5, 6],
      values: { amount: 3, available: 7, destroyed: 4, capacity: 10 },
    },
    {
      event_id: 'full-capture',
      tick: 8,
      event_type: 'CORE_RESOURCES_CAPTURED',
      position: [7, 8],
      values: { amount: 0, available: 5, destroyed: 5, capacity: 10 },
    },
    ])).toEqual([
    { eventId: 'capture', kind: 'CAPTURED', amount: 3, available: 7, destroyed: 4, capacity: 10, position: [5, 6] },
    { eventId: 'full-capture', kind: 'CAPTURED', amount: 0, available: 5, destroyed: 5, capacity: 10, position: [7, 8] },
    ])
  })

  it('returns a full-storage notice from a failed deposit', () => {
    expect(resourceActivityFromEvents([{
      event_id: 'full',
      tick: 8,
      event_type: 'DEPOSIT_FAILED',
      reason_code: 'CORE_RESOURCE_FULL',
      position: [0, 0],
      values: { capacity: 15 },
    }])).toEqual([{
      eventId: 'full',
      kind: 'FULL',
      capacity: 15,
      position: [0, 0],
    }])
  })

  it('returns notices for other deposit failures', () => {
    expect(resourceActivityFromEvents([
      { event_id: 'moving', tick: 8, event_type: 'DEPOSIT_FAILED', reason_code: 'CORE_MOVING', position: [0, 0] },
      { event_id: 'missing', tick: 8, event_type: 'DEPOSIT_FAILED', reason_code: 'CORE_NOT_PRESENT', position: [1, 0] },
      { event_id: 'empty', tick: 8, event_type: 'DEPOSIT_FAILED', reason_code: 'WORKER_EMPTY', position: [2, 0] },
    ])).toEqual([
      { eventId: 'moving', kind: 'DEPOSIT_FAILED', reason: 'CORE_MOVING', position: [0, 0] },
      { eventId: 'missing', kind: 'DEPOSIT_FAILED', reason: 'CORE_NOT_PRESENT', position: [1, 0] },
      { eventId: 'empty', kind: 'DEPOSIT_FAILED', reason: 'WORKER_EMPTY', position: [2, 0] },
    ])
  })
})
