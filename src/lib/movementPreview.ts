import type { CommandPlan, Direction, PlayerState, Position, WorldObject } from './types'
import { MAX_ENTITIES_PER_CELL } from './gameRules'
import { positionKey } from './visibility'

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

export interface MoveArrow { objectId: string; from: Position; to: Position; dashed?: boolean; hostile?: boolean }

export function plannedMoveArrows(state: PlayerState, plan: CommandPlan): MoveArrow[] {
  const arrows: MoveArrow[] = []
  for (const object of state.objects) {
    if (!object.id || !object.position) continue
    if (object.kind === 'CORE' && object.state === 'MOVING' && object.destination) {
      arrows.push({ objectId: object.id, from: object.position, to: object.destination, dashed: true, hostile: object.controlled === false })
      continue
    }
    if (!object.controlled) continue
    const action = object.kind === 'CORE' ? plan.core_action : plan.unit_actions[object.id]
    if (!action || (action.type !== 'MOVE' && action.type !== 'START_MOVE') || !action.direction) continue
    const step = steps.find((candidate) => candidate.direction === action.direction)
    if (step) arrows.push({ objectId: object.id, from: object.position, to: [object.position[0] + step.dx, object.position[1] + step.dy] })
  }
  return arrows
}

function terrainPositions(state: PlayerState, kind: 'OBSTACLE' | 'RESOURCE') {
  const positions = new Set<string>()
  for (const object of state.objects) if (object.kind === kind) for (const position of object.positions ?? []) positions.add(positionKey(position))
  return positions
}
