import type { CommandPlan, CoreActionType, PlayerState, UnitActionType, UnitType, WorldObject } from './types'
import { rangerAttackOptions } from './combatPreview'
import { coreResourceCapacity, MAX_ENTITIES_PER_CELL } from './gameRules'
import { moveTargets, projectedEntityCount } from './movementPreview'

export type AvailableAction = UnitActionType | CoreActionType

export interface ActionAvailability {
  actions: Partial<Record<AvailableAction, boolean>>
  spawns: Record<UnitType, boolean>
  unavailableReasons?: Partial<Record<AvailableAction, UnavailableActionReason>>
}

export type UnavailableActionReason =
  | { code: 'CORE_RESOURCE_FULL'; capacity: number }
  | { code: 'NOT_AT_OWN_CORE' }
  | { code: 'CORE_MOVING' }

export const UNIT_COST: Record<UnitType, number> = { WORKER: 5, VANGUARD: 10, RANGER: 12 }

export function getActionAvailability(state: PlayerState, selected: WorldObject, plan?: CommandPlan): ActionAvailability {
  const unavailable: ActionAvailability = { actions: {}, spawns: { WORKER: false, VANGUARD: false, RANGER: false } }
  if (!selected.controlled || !selected.position) return unavailable

  const carriesBeacon = state.champion_beacon.status === 'CARRIED' && state.champion_beacon.carrier_id === selected.id
  const canPickupBeacon = state.champion_beacon.status === 'GROUND' && samePosition(state.champion_beacon.position, selected.position)
  const beaconActions = { PICKUP_BEACON: canPickupBeacon, DROP_BEACON: carriesBeacon }
  const unitActions = { SELF_DESTRUCT: true }

  if (selected.kind === 'CORE') {
    const normal = selected.state !== 'MOVING'
    const hasSpawnCapacity = projectedEntityCount(state, selected.position, plan) < MAX_ENTITIES_PER_CELL
    return {
      actions: {
        HEAL: normal,
        REPAIR_SHIELD: normal,
        START_MOVE: normal && moveTargets(state, selected, plan).length > 0,
        CANCEL_MOVE: !normal,
        PICKUP_BEACON: normal && beaconActions.PICKUP_BEACON,
        DROP_BEACON: normal && beaconActions.DROP_BEACON,
        WAIT: true,
      },
      spawns: {
        WORKER: normal && hasSpawnCapacity,
        VANGUARD: normal && hasSpawnCapacity,
        RANGER: normal && hasSpawnCapacity,
      },
    }
  }

  const canMove = moveTargets(state, selected, plan).length > 0
  const ownCore = state.objects.find((object) => object.kind === 'CORE' && object.controlled === true && object.position && samePosition(object.position, selected.position!))
  const canHeal = Boolean(ownCore && ownCore.state !== 'MOVING')
  const healReason: UnavailableActionReason | undefined = canHeal
    ? undefined
    : ownCore?.state === 'MOVING' ? { code: 'CORE_MOVING' } : { code: 'NOT_AT_OWN_CORE' }
  const healingActions = { HEAL: canHeal }
  if (selected.unit_type === 'WORKER') {
    const resource = state.objects.find((object) => object.kind === 'RESOURCE' && object.positions?.some((position) => samePosition(position, selected.position!)))
    const core = state.objects.find((object) => object.kind === 'CORE' && object.controlled === true && object.state !== 'MOVING' && object.position && samePosition(object.position, selected.position!))
    const resourceCapacity = coreResourceCapacity(state.population)
    const coreHasResourceSpace = state.resources < resourceCapacity
    const canReachCoreStorage = (selected.cargo ?? 0) > 0 && Boolean(core)
    return {
      actions: { MOVE: canMove, HARVEST: (selected.cargo ?? 0) === 0 && Boolean(resource), DEPOSIT: canReachCoreStorage && coreHasResourceSpace, ...healingActions, ...beaconActions, ...unitActions, WAIT: true },
      spawns: unavailable.spawns,
      unavailableReasons: {
        ...(!canHeal && healReason ? { HEAL: healReason } : {}),
        ...(canReachCoreStorage && !coreHasResourceSpace ? { DEPOSIT: { code: 'CORE_RESOURCE_FULL' as const, capacity: resourceCapacity } } : {}),
      },
    }
  }
  if (selected.unit_type === 'VANGUARD') {
    return { actions: { MOVE: canMove, SWEEP: true, ...healingActions, ...beaconActions, ...unitActions, WAIT: true }, spawns: unavailable.spawns, unavailableReasons: !canHeal && healReason ? { HEAL: healReason } : undefined }
  }
  if (selected.unit_type === 'RANGER') return { actions: { MOVE: canMove, SHOOT: rangerAttackOptions(state, selected).length > 0, ...healingActions, ...beaconActions, ...unitActions, WAIT: true }, spawns: unavailable.spawns, unavailableReasons: !canHeal && healReason ? { HEAL: healReason } : undefined }
  return unavailable
}

function samePosition(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1]
}
