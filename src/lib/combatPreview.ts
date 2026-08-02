import type { CommandPlan, CommandSource, Direction, PlayerState, Position, WorldObject } from './types'
import { positionKey } from './visibility'

const deltas: Record<Direction, Position> = { UP: [0, -1], RIGHT: [1, 0], DOWN: [0, 1], LEFT: [-1, 0] }
const rangerRays: Position[] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]

export interface SweepMarker { objectId: string; from: Position; to: Position; source?: CommandSource }
export interface ShotMarker { objectId: string; from: Position; to: Position; source?: CommandSource }
export interface AttackOption { position: Position; targetId?: string }

export function vanguardAttackOptions(vanguard: WorldObject): AttackOption[] {
  if (!vanguard.controlled || vanguard.unit_type !== 'VANGUARD' || !vanguard.position) return []
  return Object.values(deltas).map(([dx, dy]) => ({ position: [vanguard.position![0] + dx, vanguard.position![1] + dy] }))
}

export function rangerAttackOptions(state: PlayerState, ranger: WorldObject): AttackOption[] {
  if (!ranger.controlled || ranger.unit_type !== 'RANGER' || !ranger.position) return []
  const obstacles = obstaclePositions(state)
  const hostiles = state.objects.filter((object) => object.id && object.controlled === false && object.position && (object.kind === 'CORE' || object.kind === 'UNIT'))
  const options: AttackOption[] = []
  for (const [dx, dy] of rangerRays) {
    for (let distance = 1; distance <= 3; distance++) {
      const position: Position = [ranger.position[0] + dx * distance, ranger.position[1] + dy * distance]
      if (obstacles.has(positionKey(position))) break
      const target = lowestHPAttackCandidate(hostiles, position)
      if (target?.id) options.push({ position, targetId: target.id })
    }
  }
  return options
}

function lowestHPAttackCandidate(hostiles: WorldObject[], position: Position): WorldObject | undefined {
  const onCell = hostiles.filter((object) => samePosition(object.position!, position))
  const candidates = onCell.length
    ? onCell
    : hostiles.filter((object) => Math.abs(object.position![0] - position[0]) + Math.abs(object.position![1] - position[1]) === 1)
  return [...candidates].sort((left, right) => (left.hp ?? Number.MAX_SAFE_INTEGER) - (right.hp ?? Number.MAX_SAFE_INTEGER) || left.id!.localeCompare(right.id!))[0]
}

function obstaclePositions(state: PlayerState): Set<string> {
  const obstacles = new Set<string>()
  for (const object of state.objects) if (object.kind === 'OBSTACLE') for (const position of object.positions ?? []) obstacles.add(positionKey(position))
  return obstacles
}

function samePosition(left: Position, right: Position): boolean {
  return left[0] === right[0] && left[1] === right[1]
}

export function rangerTargets(state: PlayerState, ranger: WorldObject): WorldObject[] {
  if (!ranger.controlled || ranger.unit_type !== 'RANGER' || !ranger.position) return []
  const obstacles = obstaclePositions(state)
  return state.objects.filter((target) => {
    if (!target.id || target.controlled !== false || !target.position) return false
    const dx = target.position[0] - ranger.position![0], dy = target.position[1] - ranger.position![1]
    const absX = Math.abs(dx), absY = Math.abs(dy), distance = Math.max(absX, absY)
    if (distance < 1 || distance > 3 || (dx !== 0 && dy !== 0 && absX !== absY)) return false
    const stepX = Math.sign(dx), stepY = Math.sign(dy)
    for (let step = 1; step < distance; step++) {
      const key = positionKey([ranger.position![0] + stepX * step, ranger.position![1] + stepY * step])
      if (obstacles.has(key)) return false
    }
    return true
  })
}

export function plannedSweepMarkers(state: PlayerState, plan: CommandPlan, sources?: Record<string, CommandSource>): SweepMarker[] {
  const markers: SweepMarker[] = []
  for (const object of state.objects) {
    if (object.kind !== 'UNIT' || object.unit_type !== 'VANGUARD' || !object.controlled || !object.id || !object.position) continue
    const action = plan.unit_actions[object.id]
    if (action?.type !== 'SWEEP' || !action.direction) continue
    const [dx, dy] = deltas[action.direction]
    markers.push({ objectId: object.id, from: object.position, to: [object.position[0] + dx, object.position[1] + dy], ...(sources?.[object.id] ? { source: sources[object.id] } : {}) })
  }
  return markers
}

export function plannedShotMarkers(state: PlayerState, plan: CommandPlan, sources?: Record<string, CommandSource>): ShotMarker[] {
  const markers: ShotMarker[] = []
  for (const object of state.objects) {
    if (object.kind !== 'UNIT' || object.unit_type !== 'RANGER' || !object.controlled || !object.id || !object.position) continue
    const action = plan.unit_actions[object.id]
    if (action?.type === 'SHOOT' && action.expected_cell) markers.push({ objectId: object.id, from: object.position, to: action.expected_cell, ...(sources?.[object.id] ? { source: sources[object.id] } : {}) })
  }
  return markers
}
