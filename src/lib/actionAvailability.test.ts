import { describe, expect, it } from 'vitest'
import type { PlayerState, WorldObject } from './types'
import { getActionAvailability } from './actionAvailability'

const state = (objects: WorldObject[], resources = 0): PlayerState => ({ status: 'ACTIVE', resources, population: 0, population_tier: 0, upkeep_next_tick: 0, objects, events: [] })

describe('getActionAvailability', () => {
  it('only lets a worker harvest while empty on a non-empty resource', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER', cargo: 0 }
    const resource: WorldObject = { kind: 'RESOURCE', amount: 1, positions: [[0, 0]] }
    expect(getActionAvailability(state([worker, resource]), worker).actions).toMatchObject({ HARVEST: true, DEPOSIT: false })
    expect(getActionAvailability(state([{ ...worker, cargo: 1 }, resource]), { ...worker, cargo: 1 }).actions.HARVEST).toBe(false)
  })

  it('only lets a loaded worker deposit on a stationary friendly core', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [2, 3], hp: 2, unit_type: 'WORKER', cargo: 1 }
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [2, 3], hp: 20, shield: 10, state: 'NORMAL' }
    expect(getActionAvailability(state([worker, core]), worker).actions.DEPOSIT).toBe(true)
    expect(getActionAvailability(state([worker, { ...core, state: 'MOVING' }]), worker).actions.DEPOSIT).toBe(false)
  })

  it('disables attacks with no selectable target', () => {
    const vanguard: WorldObject = { kind: 'UNIT', id: 'v', controlled: true, position: [0, 0], hp: 4, unit_type: 'VANGUARD' }
    const ranger: WorldObject = { kind: 'UNIT', id: 'r', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    expect(getActionAvailability(state([vanguard]), vanguard).actions.SWEEP).toBe(false)
    expect(getActionAvailability(state([ranger]), ranger).actions.SHOOT).toBe(false)
    const adjacentEnemy: WorldObject = { kind: 'UNIT', id: 'enemy', controlled: false, position: [1, 0], hp: 2, unit_type: 'WORKER' }
    expect(getActionAvailability(state([vanguard, adjacentEnemy]), vanguard).actions.SWEEP).toBe(true)
  })

  it('uses resources and shield state for core actions', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 20, shield: 20, state: 'NORMAL' }
    const availability = getActionAvailability(state([core], 4), core)
    expect(availability.actions.REPAIR_SHIELD).toBe(false)
    expect(availability.spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
    const funded = getActionAvailability(state([{ ...core, shield: 19 }], 12), { ...core, shield: 19 })
    expect(funded.actions.REPAIR_SHIELD).toBe(true)
    expect(funded.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
  })

  it('disables production when the core and one unit fill the cell', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 20, shield: 20, state: 'NORMAL' }
    const first: WorldObject = { kind: 'UNIT', id: 'first', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }
    expect(getActionAvailability(state([core, first], 20), core).spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
    const afterDeparture = getActionAvailability(state([core, first], 20), core, { tick: 1, unit_actions: { first: { type: 'MOVE', direction: 'RIGHT' } } })
    expect(afterDeparture.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
  })
})
