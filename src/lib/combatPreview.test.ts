import { describe, expect, it } from 'vitest'
import { plannedShotMarkers, plannedSweepMarkers, rangerTargets } from './combatPreview'
import type { PlayerState, WorldObject } from './types'

const state: PlayerState = {
  status: 'ACTIVE',
  resources: 0, population: 1, population_tier: 0, upkeep_next_tick: 0, events: [],
  champion_beacon: { position: [99, 99] },
  objects: [{ kind: 'UNIT', id: 'vanguard', controlled: true, position: [2, 3], hp: 4, unit_type: 'VANGUARD' }],
}

describe('combat preview', () => {
  it('points a sweep marker at the chosen adjacent cell', () => {
    expect(plannedSweepMarkers(state, { tick: 1, unit_actions: { vanguard: { type: 'SWEEP', direction: 'LEFT' } } })).toEqual([{ objectId: 'vanguard', from: [2, 3], to: [1, 3] }])
  })
  it('preserves the command source on a planned sweep marker', () => {
    expect(plannedSweepMarkers(
      state,
      { tick: 1, unit_actions: { vanguard: { type: 'SWEEP', direction: 'LEFT' } } },
      { vanguard: 'AGENT' },
    )[0].source).toBe('AGENT')
  })
  it('offers orthogonal Ranger targets through entities but not obstacles', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const adjacent: WorldObject = { kind: 'UNIT', id: 'adjacent', controlled: false, position: [-1, 0], hp: 4, unit_type: 'VANGUARD' }
    const open: WorldObject = { kind: 'UNIT', id: 'open', controlled: false, position: [0, 3], hp: 2, unit_type: 'RANGER' }
    const diagonal: WorldObject = { kind: 'UNIT', id: 'diagonal', controlled: false, position: [2, 2], hp: 2, unit_type: 'RANGER' }
    const blocked: WorldObject = { kind: 'UNIT', id: 'blocked', controlled: false, position: [3, 0], hp: 2, unit_type: 'RANGER' }
    const friendlyUnit: WorldObject = { kind: 'UNIT', id: 'friendly', controlled: true, position: [0, 1], hp: 4, unit_type: 'VANGUARD' }
    const friendlyCore: WorldObject = { kind: 'CORE', id: 'core', controlled: true, owner_username: 'player', position: [0, 2], hp: 5, shield: 5, state: 'NORMAL' }
    const world: PlayerState = { ...state, objects: [ranger, adjacent, open, diagonal, blocked, friendlyUnit, friendlyCore, { kind: 'OBSTACLE', positions: [[1, 0]] }] }
    expect(rangerTargets(world, ranger).map((target) => target.id)).toEqual(['adjacent', 'open'])
  })
  it('builds a shot arc from its expected target cell', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const world: PlayerState = { ...state, objects: [ranger] }
    expect(plannedShotMarkers(world, { tick: 1, unit_actions: { ranger: { type: 'SHOOT', target_id: 'enemy', expected_cell: [0, 3] } } })).toEqual([{ objectId: 'ranger', from: [0, 0], to: [0, 3] }])
  })
  it('preserves the command source on a planned shot marker', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const world: PlayerState = { ...state, objects: [ranger] }
    expect(plannedShotMarkers(
      world,
      { tick: 1, unit_actions: { ranger: { type: 'SHOOT', target_id: 'enemy', expected_cell: [0, 3] } } },
      { ranger: 'MANUAL' },
    )[0].source).toBe('MANUAL')
  })
})
