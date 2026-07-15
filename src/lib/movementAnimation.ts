import type { PlayerState, Position } from './types'

export interface EntityMotion {
  from: Position
  to: Position
}

export interface EntityMotionAnimation {
  motions: Map<string, EntityMotion>
  startedAt: number
}

export function collectEntityPositions(state: PlayerState) {
  const positions = new Map<string, Position>()
  for (const object of state.objects) {
    if (object.id && object.position && (object.kind === 'UNIT' || object.kind === 'CORE')) positions.set(object.id, [object.position[0], object.position[1]])
  }
  return positions
}

export function buildEntityMotions(previous: Map<string, Position>, current: Map<string, Position>) {
  const motions = new Map<string, EntityMotion>()
  for (const [id, to] of current) {
    const from = previous.get(id)
    if (!from || Math.abs(to[0] - from[0]) + Math.abs(to[1] - from[1]) !== 1) continue
    motions.set(id, { from, to })
  }
  return motions
}

export function continueOrStartMotionAnimation(previous: Map<string, Position>, current: Map<string, Position>, active: EntityMotionAnimation | null, now: number, reduceMotion: boolean) {
  if (reduceMotion) return null
  const motions = buildEntityMotions(previous, current)
  return motions.size > 0 ? { motions, startedAt: now } : active
}

export function interpolatePosition({ from, to }: EntityMotion, progress: number): Position {
  return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress]
}
