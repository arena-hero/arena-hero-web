import { describe, expect, it } from 'vitest'
import { resourceActivityFromEvents } from './resourceActivity'

describe('resourceActivityFromEvents', () => {
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
})
