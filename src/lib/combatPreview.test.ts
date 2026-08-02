import { describe, expect, it } from 'vitest'
import { plannedShotMarkers, plannedSweepMarkers, rangerAttackOptions, rangerTargets, vanguardAttackOptions } from './combatPreview'
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
  it('lets a Vanguard choose any adjacent attack cell', () => {
    const vanguard = state.objects[0]
    expect(vanguardAttackOptions(vanguard).map((option) => option.position)).toEqual([[2, 2], [3, 3], [2, 4], [1, 3]])
  })
  it('offers eight-direction Ranger targets through entities but not obstacles', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const adjacent: WorldObject = { kind: 'UNIT', id: 'adjacent', controlled: false, position: [-1, 0], hp: 4, unit_type: 'VANGUARD' }
    const open: WorldObject = { kind: 'UNIT', id: 'open', controlled: false, position: [0, 3], hp: 2, unit_type: 'RANGER' }
    const diagonal: WorldObject = { kind: 'UNIT', id: 'diagonal', controlled: false, position: [2, 2], hp: 2, unit_type: 'RANGER' }
    const offAxis: WorldObject = { kind: 'UNIT', id: 'off-axis', controlled: false, position: [2, 1], hp: 2, unit_type: 'RANGER' }
    const blockedDiagonal: WorldObject = { kind: 'UNIT', id: 'blocked-diagonal', controlled: false, position: [-3, 3], hp: 2, unit_type: 'RANGER' }
    const blocked: WorldObject = { kind: 'UNIT', id: 'blocked', controlled: false, position: [3, 0], hp: 2, unit_type: 'RANGER' }
    const friendlyUnit: WorldObject = { kind: 'UNIT', id: 'friendly', controlled: true, position: [0, 1], hp: 4, unit_type: 'VANGUARD' }
    const friendlyCore: WorldObject = { kind: 'CORE', id: 'core', controlled: true, owner_username: 'player', position: [0, 2], hp: 5, shield: 5, state: 'NORMAL' }
    const world: PlayerState = { ...state, objects: [ranger, adjacent, open, diagonal, offAxis, blockedDiagonal, blocked, friendlyUnit, friendlyCore, { kind: 'OBSTACLE', positions: [[1, 0], [-1, 1]] }] }
    expect(rangerTargets(world, ranger).map((target) => target.id)).toEqual(['adjacent', 'open', 'diagonal'])
  })
  it('aims at a cell and automatically tracks the lowest-HP enemy that can enter it', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const high: WorldObject = { kind: 'UNIT', id: 'high', controlled: false, position: [3, 1], hp: 4, unit_type: 'VANGUARD' }
    const low: WorldObject = { kind: 'UNIT', id: 'low', controlled: false, position: [4, 0], hp: 1, unit_type: 'WORKER' }
    const options = rangerAttackOptions({ ...state, objects: [ranger, high, low] }, ranger)
    expect(options.find((option) => option.position[0] === 3 && option.position[1] === 0)).toEqual({ position: [3, 0], targetId: 'low' })
  })
  it('prefers an enemy already in the chosen cell and does not offer cells behind obstacles', () => {
    const ranger: WorldObject = { kind: 'UNIT', id: 'ranger', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    const occupant: WorldObject = { kind: 'UNIT', id: 'occupant', controlled: false, position: [0, 2], hp: 4, unit_type: 'VANGUARD' }
    const lowerAdjacent: WorldObject = { kind: 'UNIT', id: 'lower', controlled: false, position: [1, 2], hp: 1, unit_type: 'WORKER' }
    const blocked: WorldObject = { kind: 'UNIT', id: 'blocked', controlled: false, position: [4, 0], hp: 1, unit_type: 'WORKER' }
    const options = rangerAttackOptions({ ...state, objects: [ranger, occupant, lowerAdjacent, blocked, { kind: 'OBSTACLE', positions: [[2, 0]] }] }, ranger)
    expect(options.find((option) => option.position[0] === 0 && option.position[1] === 2)?.targetId).toBe('occupant')
    expect(options.some((option) => option.position[0] === 3 && option.position[1] === 0)).toBe(false)
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
