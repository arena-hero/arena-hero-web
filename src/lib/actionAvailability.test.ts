import { describe, expect, it } from 'vitest'
import type { PlayerState, WorldObject } from './types'
import { getActionAvailability } from './actionAvailability'

const state = (objects: WorldObject[], resources = 0): PlayerState => ({ status: 'ACTIVE', resources, population: objects.filter((object) => object.kind === 'UNIT' && object.controlled).length, population_tier: 0, upkeep_next_tick: 0, champion_beacon: { position: [99, 99] }, objects, events: [] })

describe('getActionAvailability', () => {
  it('only lets an empty worker harvest on a resource point', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER', cargo: 0 }
    const resource: WorldObject = { kind: 'RESOURCE', positions: [[0, 0]] }
    expect(getActionAvailability(state([worker, resource]), worker).actions).toMatchObject({ HARVEST: true, DEPOSIT: false })
    expect(getActionAvailability(state([{ ...worker, cargo: 1 }, resource]), { ...worker, cargo: 1 }).actions.HARVEST).toBe(false)
  })

  it('only lets a loaded worker deposit on a stationary friendly core', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [2, 3], hp: 2, unit_type: 'WORKER', cargo: 1 }
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [2, 3], hp: 5, shield: 5, state: 'NORMAL' }
    expect(getActionAvailability(state([worker, core]), worker).actions.DEPOSIT).toBe(true)
    expect(getActionAvailability(state([worker, core], 5), worker).actions.DEPOSIT).toBe(false)
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
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
    const availability = getActionAvailability(state([core], 4), core)
    expect(availability.actions.REPAIR_SHIELD).toBe(false)
    expect(availability.spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
    const funded = getActionAvailability(state([{ ...core, shield: 4 }], 12), { ...core, shield: 4 })
    expect(funded.actions.REPAIR_SHIELD).toBe(true)
    expect(funded.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })

    const beaconState = { ...state([{ ...core, shield: 9 }], 1), champion_beacon: { position: [0, 0] as [number, number], status: 'CARRIED' as const, carrier_id: 'core' } }
    expect(getActionAvailability(beaconState, { ...core, shield: 9 }).actions.REPAIR_SHIELD).toBe(true)
    expect(getActionAvailability(beaconState, { ...core, shield: 10 }).actions.REPAIR_SHIELD).toBe(false)
  })

  it('disables production when the core and one unit fill the cell', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
    const first: WorldObject = { kind: 'UNIT', id: 'first', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }
    expect(getActionAvailability(state([core, first], 20), core).spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
    const afterDeparture = getActionAvailability(state([core, first], 20), core, { tick: 1, unit_actions: { first: { type: 'MOVE', direction: 'RIGHT' } } })
    expect(afterDeparture.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
  })

  it('allows only the same-cell object to pick up or its carrier to drop the Beacon', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [3, 4], hp: 2, unit_type: 'WORKER', cargo: 0 }
    const ground = { ...state([worker]), champion_beacon: { position: [3, 4] as [number, number], status: 'GROUND' as const } }
    expect(getActionAvailability(ground, worker).actions).toMatchObject({ PICKUP_BEACON: true, DROP_BEACON: false })
    const carried = { ...ground, champion_beacon: { position: [3, 4] as [number, number], status: 'CARRIED' as const, carrier_id: 'worker' } }
    expect(getActionAvailability(carried, worker).actions).toMatchObject({ PICKUP_BEACON: false, DROP_BEACON: true })
  })
})
