import type { CommandPlan, Direction, PlayerState, Position, WorldObject } from './types'
import type { CommandPlanSources } from './commandPlans'
import type { CommandSource } from './types'
import { MAX_ENTITIES_PER_CELL } from './gameRules'
import { positionKey } from './visibility'
import type { MovementRoute } from './pathfinding'

const steps: { direction: Direction; dx: number; dy: number }[] = [
  { direction: 'UP', dx: 0, dy: -1 }, { direction: 'RIGHT', dx: 1, dy: 0 },
  { direction: 'DOWN', dx: 0, dy: 1 }, { direction: 'LEFT', dx: -1, dy: 0 },
]

export function moveTargets(state: PlayerState, selected: WorldObject, plan?: CommandPlan): Position[] {
  if (!selected.controlled || !selected.position || (selected.kind !== 'UNIT' && selected.kind !== 'CORE')) return []
  const obstacles = terrainPositions(state, 'OBSTACLE'), resources = terrainPositions(state, 'RESOURCE')
  return steps.map(({ dx, dy }) => [selected.position![0] + dx, selected.position![1] + dy] as Position).filter((target) => {
    const key = positionKey(target)
    if (obstacles.has(key)) return false
    if (state.objects.some((object) => object.controlled === false && (object.kind === 'CORE' || object.kind === 'UNIT') && object.position?.[0] === target[0] && object.position?.[1] === target[1])) return false
    if (selected.kind !== 'CORE') return projectedEntityCount(state, target, plan, selected.id) < MAX_ENTITIES_PER_CELL
    if (resources.has(key)) return false
    if (state.objects.some((object) => object.position?.[0] === target[0] && object.position?.[1] === target[1] && (object.kind === 'CORE' || object.controlled === false))) return false
    return projectedEntityCount(state, target, plan, selected.id) < MAX_ENTITIES_PER_CELL
  })
}

export function projectedEntityCount(state: PlayerState, position: Position, plan?: CommandPlan, excludedEntityId?: string) {
  let count = state.objects.filter((object) => (object.kind === 'UNIT' || object.kind === 'CORE') && object.id !== excludedEntityId && object.position?.[0] === position[0] && object.position?.[1] === position[1]).length
  if (!plan) return count
  for (const object of state.objects) {
    if (object.kind !== 'UNIT' || !object.controlled || !object.id || object.id === excludedEntityId || !object.position) continue
    const action = plan.unit_actions[object.id]
    if (action?.type === 'SELF_DESTRUCT') {
      if (object.position[0] === position[0] && object.position[1] === position[1]) count--
      continue
    }
    if (action?.type !== 'MOVE' || !action.direction) continue
    const step = steps.find((candidate) => candidate.direction === action.direction)
    if (!step) continue
    if (object.position[0] === position[0] && object.position[1] === position[1]) count--
    if (object.position[0] + step.dx === position[0] && object.position[1] + step.dy === position[1]) count++
  }
  return count
}

export function directionTo(from: Position, to: Position): Direction | null {
  const dx = to[0] - from[0], dy = to[1] - from[1]
  return steps.find((step) => step.dx === dx && step.dy === dy)?.direction ?? null
}

export interface MoveArrow { objectId: string; from: Position; to: Position; dashed?: boolean; hostile?: boolean; source?: CommandSource }

export function plannedMoveArrows(state: PlayerState, plan: CommandPlan, routes: MovementRoute[] = [], sources?: CommandPlanSources): MoveArrow[] {
  const arrows: MoveArrow[] = []
  const routed = new Set(routes.map((route) => route.objectId))
  const objectsById = new Map(state.objects.flatMap((object) => object.id ? [[object.id, object] as const] : []))
  for (const route of routes) {
    const object = objectsById.get(route.objectId)
    const currentDestination = object ? currentStepDestination(object, plan) : null
    for (let index = 0; index < route.path.length - 1; index++) {
      const from = route.path[index], to = route.path[index + 1]
      const current = index === 0 && currentDestination && samePosition(currentDestination, to)
      arrows.push({ objectId: route.objectId, from, to, dashed: !current, ...(sources ? { source: 'MANUAL' as const } : {}) })
    }
  }
  for (const object of state.objects) {
    if (!object.id || !object.position) continue
    if (routed.has(object.id)) continue
    if (object.kind === 'CORE' && object.state === 'MOVING' && object.destination) {
      arrows.push({ objectId: object.id, from: object.position, to: object.destination, dashed: false, hostile: object.controlled === false })
      continue
    }
    if (!object.controlled) continue
    const action = object.kind === 'CORE' ? plan.core_action : plan.unit_actions[object.id]
    if (!action || (action.type !== 'MOVE' && action.type !== 'START_MOVE') || !action.direction) continue
    const step = steps.find((candidate) => candidate.direction === action.direction)
    if (step) arrows.push({
      objectId: object.id, from: object.position,
      to: [object.position[0] + step.dx, object.position[1] + step.dy],
      ...(object.kind === 'CORE'
        ? sources?.coreSource ? { source: sources.coreSource } : {}
        : sources?.unitSources[object.id] ? { source: sources.unitSources[object.id] } : {}),
    })
  }
  return arrows
}

function currentStepDestination(object: WorldObject, plan: CommandPlan): Position | null {
  if (!object.position) return null
  if (object.kind === 'CORE' && object.state === 'MOVING' && object.destination) return object.destination
  const action = object.kind === 'CORE' ? plan.core_action : object.id ? plan.unit_actions[object.id] : undefined
  if (!action || (action.type !== 'MOVE' && action.type !== 'START_MOVE') || !action.direction) return null
  const step = steps.find((candidate) => candidate.direction === action.direction)
  return step ? [object.position[0] + step.dx, object.position[1] + step.dy] : null
}

function samePosition(left: Position, right: Position) {
  return left[0] === right[0] && left[1] === right[1]
}

function terrainPositions(state: PlayerState, kind: 'OBSTACLE' | 'RESOURCE') {
  const positions = new Set<string>()
  for (const object of state.objects) if (object.kind === kind) for (const position of object.positions ?? []) positions.add(positionKey(position))
  return positions
}
