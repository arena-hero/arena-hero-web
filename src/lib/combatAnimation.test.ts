import { describe, expect, it } from 'vitest'
import { resolvedShotMarkers, resolvedSweepMarkers } from './combatAnimation'
import type { PlayerState } from './types'

const state: PlayerState = {
  status: 'ACTIVE',
  resources: 0, population: 1,
  champion_beacon: { position: [99, 99] },
  objects: [{ kind: 'UNIT', id: 'vanguard', controlled: true, position: [2, 3], hp: 4, unit_type: 'VANGUARD' }],
  events: [{ event_id: 'event-7', tick: 7, event_type: 'SWEEP_RESOLVED', actor_id: 'vanguard', position: [3, 3] }],
}

describe('combat animation', () => {
  it('builds a resolved sweep from the previous actor position', () => {
    expect(resolvedSweepMarkers(state, new Map([['vanguard', [2, 3]]]), new Set())).toEqual([
      { objectId: 'vanguard', from: [2, 3], to: [3, 3] },
    ])
  })

  it('does not replay an event that was already animated', () => {
    expect(resolvedSweepMarkers(state, new Map(), new Set(['event-7']))).toEqual([])
  })

  it('builds hit and miss projectiles from resolved shot events', () => {
    const shotState: PlayerState = {
      ...state,
      objects: [
        { kind: 'UNIT', id: 'ranger-hit', controlled: true, position: [4, 4], hp: 2, unit_type: 'RANGER' },
        { kind: 'UNIT', id: 'ranger-miss', controlled: true, position: [8, 8], hp: 2, unit_type: 'RANGER' },
      ],
      events: [
        { event_id: 'shot-hit', tick: 8, event_type: 'SHOT_HIT', actor_id: 'ranger-hit', target_id: 'enemy', position: [4, 5] },
        { event_id: 'shot-miss', tick: 8, event_type: 'SHOT_MISSED', actor_id: 'ranger-miss', target_id: 'gone', position: [8, 11] },
      ],
    }

    expect(resolvedShotMarkers(shotState, new Map([['ranger-hit', [4, 3]]]), new Set())).toEqual([
      { eventId: 'shot-hit', objectId: 'ranger-hit', from: [4, 3], to: [4, 5], hit: true },
      { eventId: 'shot-miss', objectId: 'ranger-miss', from: [8, 8], to: [8, 11], hit: false },
    ])
  })

  it('does not replay an already animated shot', () => {
    const shotState: PlayerState = {
      ...state,
      objects: [{ kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }],
      events: [{ event_id: 'shot-seen', tick: 9, event_type: 'SHOT_HIT', actor_id: 'ranger', position: [0, 1] }],
    }
    expect(resolvedShotMarkers(shotState, new Map(), new Set(['shot-seen']))).toEqual([])
  })
})
