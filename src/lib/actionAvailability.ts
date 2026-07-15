import type { CommandPlan, CoreActionType, PlayerState, UnitActionType, UnitType, WorldObject } from './types'
import { rangerTargets } from './combatPreview'
import { MAX_UNITS_PER_CELL } from './gameRules'
import { moveTargets, projectedUnitCount } from './movementPreview'

export type AvailableAction = UnitActionType | CoreActionType

export interface ActionAvailability {
  actions: Partial<Record<AvailableAction, boolean>>
  spawns: Record<UnitType, boolean>
}

export const UNIT_COST: Record<UnitType, number> = { WORKER: 5, VANGUARD: 10, RANGER: 12 }
const CORE_MAX_SHIELD = 20

export function getActionAvailability(state: PlayerState, selected: WorldObject, plan?: CommandPlan): ActionAvailability {
  const unavailable: ActionAvailability = { actions: {}, spawns: { WORKER: false, VANGUARD: false, RANGER: false } }
  if (!selected.controlled || !selected.position) return unavailable

  if (selected.kind === 'CORE') {
    const normal = selected.state !== 'MOVING'
    const hasSpawnCapacity = projectedUnitCount(state, selected.position, plan) < MAX_UNITS_PER_CELL
    return {
      actions: {
        REPAIR_SHIELD: normal && state.resources >= 1 && (selected.shield ?? 0) < CORE_MAX_SHIELD,
        START_MOVE: normal && moveTargets(state, selected, plan).length > 0,
        CANCEL_MOVE: !normal,
        WAIT: true,
      },
      spawns: {
        WORKER: normal && hasSpawnCapacity && state.resources >= UNIT_COST.WORKER,
        VANGUARD: normal && hasSpawnCapacity && state.resources >= UNIT_COST.VANGUARD,
        RANGER: normal && hasSpawnCapacity && state.resources >= UNIT_COST.RANGER,
      },
    }
  }

  const canMove = moveTargets(state, selected, plan).length > 0
  if (selected.unit_type === 'WORKER') {
    const resource = state.objects.find((object) => object.kind === 'RESOURCE' && (object.amount ?? 0) > 0 && object.positions?.some((position) => samePosition(position, selected.position!)))
    const core = state.objects.find((object) => object.kind === 'CORE' && object.controlled === true && object.state !== 'MOVING' && object.position && samePosition(object.position, selected.position!))
    return { actions: { MOVE: canMove, HARVEST: (selected.cargo ?? 0) === 0 && Boolean(resource), DEPOSIT: (selected.cargo ?? 0) > 0 && Boolean(core), WAIT: true }, spawns: unavailable.spawns }
  }
  if (selected.unit_type === 'VANGUARD') {
    const canSweep = state.objects.some((object) => object.controlled === false && object.position && Math.abs(object.position[0] - selected.position![0]) + Math.abs(object.position[1] - selected.position![1]) === 1)
    return { actions: { MOVE: canMove, SWEEP: canSweep, WAIT: true }, spawns: unavailable.spawns }
  }
  if (selected.unit_type === 'RANGER') return { actions: { MOVE: canMove, SHOOT: rangerTargets(state, selected).length > 0, WAIT: true }, spawns: unavailable.spawns }
  return unavailable
}

function samePosition(left: [number, number], right: [number, number]) {
  return left[0] === right[0] && left[1] === right[1]
}
