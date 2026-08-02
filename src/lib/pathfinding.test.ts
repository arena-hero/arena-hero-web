import { describe, expect, it } from 'vitest'
import type { ExploredCell } from './exploration'
import { applyAutonomousMovement, findMovementPath, reachableMovementDestinations, readMovementGoals } from './pathfinding'
import type { PlayerState, Position, WorldObject } from './types'
import { positionKey } from './visibility'

const unit: WorldObject = { kind: 'UNIT', id: 'unit', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }
const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
const state = (objects: WorldObject[]): PlayerState => ({ status: 'ACTIVE', resources: 0, population: 1, population_tier: 0, upkeep_next_tick: 0, champion_beacon: { position: [99, 99] }, events: [], objects })
const explored = (...positions: Position[]) => new Map<string, ExploredCell>(positions.map((position) => [positionKey(position), { position, kind: 'EMPTY' }]))

describe('autonomous pathfinding', () => {
  it('finds a deterministic shortest path around obstacles', () => {
    const world = state([unit, { kind: 'OBSTACLE', positions: [[1, 0]] }])
    const known = explored([0, 0], [0, -1], [1, -1], [2, -1], [0, 1], [1, 1], [2, 1], [2, 0])
    expect(findMovementPath(world, known, unit, [2, 0]).path).toEqual([[0, 0], [0, -1], [1, -1], [2, -1], [2, 0]])
  })

  it('will not route through enemies or a cell already holding two entities', () => {
    const world = state([
      unit,
      { kind: 'UNIT', id: 'enemy', controlled: false, position: [1, 0], hp: 2, unit_type: 'RANGER' },
      { kind: 'UNIT', id: 'one', controlled: true, position: [0, -1], hp: 2, unit_type: 'WORKER' },
      { kind: 'UNIT', id: 'two', controlled: true, position: [0, -1], hp: 2, unit_type: 'WORKER' },
    ])
    const known = explored([0, 0], [1, 0], [0, -1], [0, 1], [1, 1], [2, 1], [2, 0])
    expect(findMovementPath(world, known, unit, [2, 0]).path).toEqual([[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]])
  })

  it('routes into capacity released by self-destruct before movement', () => {
    const first = { ...unit, id: 'first', position: [0, 1] as Position }
    const second = { ...unit, id: 'second', position: [0, 1] as Position }
    const world = state([unit, first, second])
    const known = explored([0, 0], [0, 1])
    expect(findMovementPath(world, known, unit, [0, 1]).path).toBeNull()
    expect(findMovementPath(world, known, unit, [0, 1], {
      tick: 1,
      unit_actions: { first: { type: 'SELF_DESTRUCT' } },
    }).path).toEqual([[0, 0], [0, 1]])
  })

  it('allows Units through resource cells but keeps the Core off them', () => {
    const resource: WorldObject = { kind: 'RESOURCE', positions: [[1, 0]] }
    const known = explored([0, 0], [1, 0], [2, 0])
    expect(findMovementPath(state([unit, resource]), known, unit, [2, 0]).path).toEqual([[0, 0], [1, 0], [2, 0]])
    expect(findMovementPath(state([core, resource]), known, core, [2, 0]).path).not.toContainEqual([1, 0])
  })

  it('lets current visibility replace a stale remembered resource', () => {
    const known = explored([0, 0], [1, 0], [2, 0])
    known.set('1,0', { position: [1, 0], kind: 'RESOURCE' })
    expect(findMovementPath(state([core]), known, core, [2, 0]).path).toEqual([[0, 0], [1, 0], [2, 0]])
  })

  it('submits only the next step and completes a goal at its destination', () => {
    const known = explored([0, 0], [1, 0], [2, 0])
    const active = applyAutonomousMovement(state([unit]), known, { unit: [2, 0] }, { tick: 9, unit_actions: {} })
    expect(active.plan.unit_actions.unit).toEqual({ type: 'MOVE', direction: 'RIGHT' })
    expect(active.completed).toEqual([])
    const arrived = applyAutonomousMovement(state([{ ...unit, position: [2, 0] }]), known, { unit: [2, 0] }, { tick: 10, unit_actions: {} })
    expect(arrived.completed).toEqual(['unit'])
    expect(arrived.plan.unit_actions).toEqual({})
  })

  it('reserves the last free slot when autonomous moves share a destination', () => {
    const first = { ...unit, id: 'a', position: [0, -1] as Position }
    const second = { ...unit, id: 'b', position: [0, 1] as Position }
    const occupyingCore = { ...core, position: [0, 0] as Position }
    const result = applyAutonomousMovement(state([occupyingCore, first, second]), explored([0, -1], [0, 0], [0, 1]), { a: [0, 0], b: [0, 0] }, { tick: 11, unit_actions: {} })
    expect(result.plan.unit_actions.a).toEqual({ type: 'MOVE', direction: 'DOWN' })
    expect(result.plan.unit_actions.b).toBeUndefined()
    expect(result.blocked).toContain('b')
  })

  it('rejects unknown destinations and ignores malformed stored goals', () => {
    expect(findMovementPath(state([unit]), explored([0, 0]), unit, [8, 8]).reason).toBe('UNKNOWN_DESTINATION')
    expect(readMovementGoals('{"unit":[2,3],"bad":[1],"unsafe":[1.5,2]}')).toEqual({ unit: [2, 3] })
  })

  it('returns every connected legal explored destination for move selection', () => {
    const blocked: WorldObject = { kind: 'OBSTACLE', positions: [[0, -1]] }
    const enemy: WorldObject = { kind: 'UNIT', id: 'enemy', controlled: false, position: [-1, 0], hp: 2, unit_type: 'RANGER' }
    const known = explored([0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [0, -1], [-1, 0])
    const destinations = reachableMovementDestinations(state([unit, blocked, enemy]), known, unit)
    expect(destinations).toEqual(expect.arrayContaining([[1, 0], [0, 1], [2, 0], [1, 1]]))
    expect(destinations).not.toContainEqual([0, -1])
    expect(destinations).not.toContainEqual([-1, 0])
  })
})
