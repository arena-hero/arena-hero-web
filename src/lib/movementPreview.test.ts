import { describe, expect, it } from 'vitest'
import { directionTo, moveTargets, plannedMoveArrows } from './movementPreview'
import type { PlayerState, WorldObject } from './types'

const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
const unit: WorldObject = { kind: 'UNIT', id: 'unit', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }
const state = (selected: WorldObject): PlayerState => ({ status: 'ACTIVE', resources: 0, population: 1, population_tier: 0, upkeep_next_tick: 0, champion_beacon: { position: [99, 99] }, events: [], objects: [selected, { kind: 'OBSTACLE', positions: [[0, -1]] }, { kind: 'RESOURCE', positions: [[1, 0]] }, { kind: 'UNIT', id: 'enemy', controlled: false, position: [-1, 0], hp: 2, unit_type: 'RANGER' }] })

describe('movement preview', () => {
  it('lets units enter resources but excludes obstacles and enemy cells', () => expect(moveTargets(state(unit), unit)).toEqual([[1, 0], [0, 1]]))
  it('shows only empty or friendly-occupied cells for Core migration', () => expect(moveTargets(state(core), core)).toEqual([[0, 1]]))
  it('does not show a unit destination that already contains two units', () => {
    const full = state(unit)
    full.objects.push(
      { kind: 'UNIT', id: 'first', controlled: true, position: [0, 1], hp: 2, unit_type: 'WORKER' },
      { kind: 'UNIT', id: 'second', controlled: true, position: [0, 1], hp: 2, unit_type: 'WORKER' },
    )
    expect(moveTargets(full, unit)).not.toContainEqual([0, 1])
    expect(moveTargets(full, unit, { tick: 1, unit_actions: { first: { type: 'MOVE', direction: 'RIGHT' } } })).toContainEqual([0, 1])
  })
  it('counts a Core and Unit as a full destination cell', () => {
    const full = state(unit)
    full.objects.push(
      { kind: 'CORE', id: 'core-at-target', controlled: true, position: [0, 1], hp: 5, shield: 5, state: 'NORMAL' },
      { kind: 'UNIT', id: 'worker-at-target', controlled: true, position: [0, 1], hp: 2, unit_type: 'WORKER' },
    )
    expect(moveTargets(full, unit)).not.toContainEqual([0, 1])
  })
  it('maps an adjacent target to a direction', () => expect(directionTo([2, 3], [1, 3])).toBe('LEFT'))
  it('builds arrows from the current plan', () => expect(plannedMoveArrows(state(unit), { tick: 1, unit_actions: { unit: { type: 'MOVE', direction: 'DOWN' } } })[0].to).toEqual([0, 1]))
  it('preserves the command source on a planned move arrow', () => {
    expect(plannedMoveArrows(
      state(unit),
      { tick: 1, unit_actions: { unit: { type: 'MOVE', direction: 'DOWN' } } },
      [],
      { unitSources: { unit: 'AGENT' } },
    )[0].source).toBe('AGENT')
  })
  it('uses a solid arrow for the movement executing this Tick', () => {
    const moving = { ...core, state: 'MOVING' as const, destination: [1, 0] as [number, number] }
    expect(plannedMoveArrows(state(moving), { tick: 1, unit_actions: {} })[0]).toMatchObject({ from: [0, 0], to: [1, 0], dashed: false })
  })
  it('draws the current route edge solid and future edges dashed', () => {
    const route = { objectId: 'unit', destination: [2, 0] as [number, number], path: [[0, 0], [1, 0], [2, 0]] as [number, number][], blocked: false }
    expect(plannedMoveArrows(state(unit), { tick: 1, unit_actions: { unit: { type: 'MOVE', direction: 'RIGHT' } } }, [route]).map((arrow) => arrow.dashed)).toEqual([false, true])
  })
})
