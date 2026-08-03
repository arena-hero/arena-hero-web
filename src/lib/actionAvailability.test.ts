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
    expect(getActionAvailability(state([worker]), worker).actions.SELF_DESTRUCT).toBe(true)
  })

  it('only lets a loaded worker deposit on a stationary friendly core', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [2, 3], hp: 2, unit_type: 'WORKER', cargo: 1 }
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [2, 3], hp: 5, shield: 5, state: 'NORMAL' }
    expect(getActionAvailability(state([worker, core]), worker).actions.DEPOSIT).toBe(true)
    const fullCore = getActionAvailability(state([worker, core], 10), worker)
    expect(fullCore.actions.DEPOSIT).toBe(false)
    expect(fullCore.unavailableReasons?.DEPOSIT).toEqual({ code: 'CORE_RESOURCE_FULL', capacity: 10 })
    expect(getActionAvailability(state([worker, { ...core, state: 'MOVING' }]), worker).actions.DEPOSIT).toBe(false)
  })

	it('always lets Vanguards and Rangers choose an attack cell', () => {
    const vanguard: WorldObject = { kind: 'UNIT', id: 'v', controlled: true, position: [0, 0], hp: 4, unit_type: 'VANGUARD' }
    const ranger: WorldObject = { kind: 'UNIT', id: 'r', controlled: true, position: [0, 0], hp: 2, unit_type: 'RANGER' }
    expect(getActionAvailability(state([vanguard]), vanguard).actions.SWEEP).toBe(true)
		expect(getActionAvailability(state([ranger]), ranger).actions.SHOOT).toBe(true)
    const adjacentEnemy: WorldObject = { kind: 'UNIT', id: 'enemy', controlled: false, position: [1, 0], hp: 2, unit_type: 'WORKER' }
    expect(getActionAvailability(state([vanguard, adjacentEnemy]), vanguard).actions.SWEEP).toBe(true)
    const enteringRange: WorldObject = { kind: 'UNIT', id: 'entering', controlled: false, position: [4, 0], hp: 1, unit_type: 'WORKER' }
    expect(getActionAvailability(state([ranger, enteringRange]), ranger).actions.SHOOT).toBe(true)
  })

  it('allows post-combat Core actions to be planned before damage or captured resources', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
    const availability = getActionAvailability(state([core], 4), core)
    expect(availability.actions).toMatchObject({ SELF_DESTRUCT: true, HEAL: true, REPAIR_SHIELD: true })
    expect(availability.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
    const funded = getActionAvailability(state([{ ...core, shield: 4 }], 12), { ...core, shield: 4 })
    expect(funded.actions.REPAIR_SHIELD).toBe(true)
    expect(funded.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })

    const beaconState = { ...state([{ ...core, shield: 9 }], 1), champion_beacon: { position: [0, 0] as [number, number], status: 'CARRIED' as const, carrier_id: 'core' } }
    expect(getActionAvailability(beaconState, { ...core, shield: 9 }).actions.REPAIR_SHIELD).toBe(true)
    expect(getActionAvailability(beaconState, { ...core, shield: 10 }).actions.REPAIR_SHIELD).toBe(true)
  })

  it('allows a moving Core to self-destruct without enabling its restricted actions', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'MOVING', move_direction: 'RIGHT', move_progress: 2, move_required_ticks: 4, destination: [1, 0] }
    const availability = getActionAvailability(state([core], 20), core)
    expect(availability.actions).toMatchObject({ SELF_DESTRUCT: true, CANCEL_MOVE: true, HEAL: false, REPAIR_SHIELD: false, WAIT: true })
    expect(availability.spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
  })

  it('only allows Unit healing at its own stationary Core', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER', cargo: 0 }
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
    expect(getActionAvailability(state([worker, core]), worker).actions.HEAL).toBe(true)

    const away = getActionAvailability(state([worker, { ...core, position: [1, 0] }]), worker)
    expect(away.actions.HEAL).toBe(false)
    expect(away.unavailableReasons?.HEAL).toEqual({ code: 'NOT_AT_OWN_CORE' })

    const moving = getActionAvailability(state([worker, { ...core, state: 'MOVING' }]), worker)
    expect(moving.actions.HEAL).toBe(false)
    expect(moving.unavailableReasons?.HEAL).toEqual({ code: 'CORE_MOVING' })
  })

  it('disables production when the core and one unit fill the cell', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' }
    const first: WorldObject = { kind: 'UNIT', id: 'first', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }
    expect(getActionAvailability(state([core, first], 20), core).spawns).toEqual({ WORKER: false, VANGUARD: false, RANGER: false })
    const afterDeparture = getActionAvailability(state([core, first], 20), core, { tick: 1, unit_actions: { first: { type: 'MOVE', direction: 'RIGHT' } } })
    expect(afterDeparture.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
    const afterSelfDestruct = getActionAvailability(state([core, first], 20), core, { tick: 1, unit_actions: { first: { type: 'SELF_DESTRUCT' } } })
    expect(afterSelfDestruct.spawns).toEqual({ WORKER: true, VANGUARD: true, RANGER: true })
  })

  it('allows only the same-cell object to pick up or its carrier to drop the Beacon', () => {
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [3, 4], hp: 2, unit_type: 'WORKER', cargo: 0 }
    const ground = { ...state([worker]), champion_beacon: { position: [3, 4] as [number, number], status: 'GROUND' as const } }
    expect(getActionAvailability(ground, worker).actions).toMatchObject({ PICKUP_BEACON: true, DROP_BEACON: false })
    const carried = { ...ground, champion_beacon: { position: [3, 4] as [number, number], status: 'CARRIED' as const, carrier_id: 'worker' } }
    expect(getActionAvailability(carried, worker).actions).toMatchObject({ PICKUP_BEACON: false, DROP_BEACON: true })
  })
})
