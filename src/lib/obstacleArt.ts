import type { Position } from './types'
import { positionKey } from './visibility'

export const OBSTACLE_SPRITE_PATHS = [
  '/assets/game/obstacles/asteroid-large-1.png',
  '/assets/game/obstacles/asteroid-large-2.png',
] as const

export interface ObstacleCellShape {
  north: boolean
  east: boolean
  south: boolean
  west: boolean
}

export function obstacleCellShape(position: Position, occupied: ReadonlySet<string>): ObstacleCellShape {
  const [x, y] = position
  return {
    north: occupied.has(positionKey([x, y - 1])),
    east: occupied.has(positionKey([x + 1, y])),
    south: occupied.has(positionKey([x, y + 1])),
    west: occupied.has(positionKey([x - 1, y])),
  }
}

export function obstacleSpriteIndex([x, y]: Position, count: number = OBSTACLE_SPRITE_PATHS.length) {
  if (count <= 0) return 0
  const hash = (Math.imul(x + 97, 73_856_093) ^ Math.imul(y - 193, 19_349_663)) >>> 0
  return hash % count
}

export function obstacleSpriteRect(screenX: number, screenY: number, cell: number) {
  const size = Math.max(1, Math.round(cell * .86))
  return { left: Math.round(screenX - size / 2), top: Math.round(screenY - size / 2), size }
}
