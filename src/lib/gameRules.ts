import type { PlayerState } from './types'

export const MAX_ENTITIES_PER_CELL = 2
export const RESPAWN_DELAY_TICKS = 20
export const CORE_MAX_HP = 5
export const CORE_MAX_SHIELD = 5
export const CORE_BEACON_MAX_SHIELD = 10
export const CORE_RESOURCE_CAPACITY_PER_UNIT = 5
export const CORE_RESOURCE_MINIMUM_CAPACITY = 10

export function coreResourceCapacity(population: number) {
  return Math.max(CORE_RESOURCE_MINIMUM_CAPACITY, Math.max(0, population) * CORE_RESOURCE_CAPACITY_PER_UNIT)
}

export function playerOwnsChampionBeacon(state: PlayerState) {
  const carrierId = state.champion_beacon.status === 'CARRIED' ? state.champion_beacon.carrier_id : undefined
  return Boolean(carrierId && state.objects.some((object) => object.controlled === true && object.id === carrierId))
}

export function coreShieldLimit(state: PlayerState) {
  return playerOwnsChampionBeacon(state) ? CORE_BEACON_MAX_SHIELD : CORE_MAX_SHIELD
}
