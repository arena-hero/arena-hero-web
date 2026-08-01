import type { CommandPlan, CommandSource, Direction, PlayerState, Position, WorldObject } from './types'
import { positionKey } from './visibility'

const deltas: Record<Direction, Position> = { UP: [0, -1], RIGHT: [1, 0], DOWN: [0, 1], LEFT: [-1, 0] }

export interface SweepMarker { objectId: string; from: Position; to: Position; source?: CommandSource }
export interface ShotMarker { objectId: string; from: Position; to: Position; source?: CommandSource }

export function rangerTargets(state: PlayerState, ranger: WorldObject): WorldObject[] {
  if (!ranger.controlled || ranger.unit_type !== 'RANGER' || !ranger.position) return []
  const obstacles = new Set<string>()
  for (const object of state.objects) {
    if (object.kind === 'OBSTACLE') for (const position of object.positions ?? []) obstacles.add(positionKey(position))
  }
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
