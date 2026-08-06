import type { PlayerState, UnitType } from './types'

export const MAX_ENTITIES_PER_CELL = 2
export const CORE_MAX_HP = 5
export const CORE_MAX_SHIELD = 5
export const CORE_BEACON_MAX_SHIELD = 10
export const CORE_RESOURCE_CAPACITY_PER_UNIT = 5
export const CORE_RESOURCE_MINIMUM_CAPACITY = 10
export const UNIT_BASE_COST: Record<UnitType, number> = { WORKER: 5, VANGUARD: 10, RANGER: 12 }

export function coreResourceCapacity(population: number) {
  return Math.max(CORE_RESOURCE_MINIMUM_CAPACITY, Math.max(0, population) * CORE_RESOURCE_CAPACITY_PER_UNIT)
}

export function unitCost(unitType: UnitType, population: number) {
  const baseCost = UNIT_BASE_COST[unitType]
  const exponent = population < 20 ? 0 : Math.floor((population - 20) / 5) + 1
  const numerator = BigInt(baseCost) * (13n ** BigInt(exponent))
  const denominator = 10n ** BigInt(exponent)
  const rounded = ((2n * numerator) + denominator) / (2n * denominator)
  return rounded > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(rounded)
}

export function playerOwnsChampionBeacon(state: PlayerState) {
  const carrierId = state.champion_beacon.status === 'CARRIED' ? state.champion_beacon.carrier_id : undefined
  return Boolean(carrierId && state.objects.some((object) => object.controlled === true && object.id === carrierId))
}

export function coreShieldLimit(state: PlayerState) {
  return playerOwnsChampionBeacon(state) ? CORE_BEACON_MAX_SHIELD : CORE_MAX_SHIELD
}

export function visibleCoreShieldLimit(state: PlayerState, coreId?: string) {
  const carrierId = state.champion_beacon.status === 'CARRIED' ? state.champion_beacon.carrier_id : undefined
  return coreId && carrierId === coreId ? CORE_BEACON_MAX_SHIELD : CORE_MAX_SHIELD
}
