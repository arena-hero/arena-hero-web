import type { Position } from './types'

export const RESOURCE_SPRITE_PATHS = [
  '/assets/resources/neo-expressionist/sprites/crystal-1.png',
  '/assets/resources/neo-expressionist/sprites/crystal-2.png',
] as const

export function resourceSpriteIndex([x, y]: Position, count: number = RESOURCE_SPRITE_PATHS.length) {
  if (count <= 0) return 0
  const hash = (Math.imul(x - 41, 83_492_791) ^ Math.imul(y + 137, 29_791_303)) >>> 0
  return hash % count
}

export function resourceSpriteRect(screenX: number, screenY: number, cell: number) {
  const size = Math.max(1, Math.round(cell * .92))
  return { left: Math.round(screenX - size / 2), top: Math.round(screenY - size / 2), size }
}
