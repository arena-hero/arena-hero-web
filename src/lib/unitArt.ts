import type { UnitType, WorldObject } from './types'

export type UnitArtType = UnitType | 'CORE'

export const UNIT_SPRITE_PATHS: Record<UnitArtType, string> = {
  CORE: '/assets/game/units/core.png',
  WORKER: '/assets/game/units/worker.png',
  VANGUARD: '/assets/game/units/vanguard.png',
  RANGER: '/assets/game/units/ranger.png',
}

export function unitArtType(object: WorldObject): UnitArtType | null {
  if (object.kind === 'CORE') return 'CORE'
  return object.kind === 'UNIT' ? object.unit_type ?? null : null
}

export function unitSpriteRect(screenX: number, screenY: number, cell: number, type: UnitArtType, aspectRatio: number) {
  const maxSize = Math.max(1, Math.round(cell * (type === 'CORE' ? .72 : type === 'RANGER' ? .68 : .62)))
  const aspect = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1
  const width = Math.max(1, Math.round(aspect >= 1 ? maxSize : maxSize * aspect))
  const height = Math.max(1, Math.round(aspect >= 1 ? maxSize / aspect : maxSize))
  return { left: Math.round(screenX - width / 2), top: Math.round(screenY - height / 2), width, height }
}

export interface WorldViewport { minX: number; maxX: number; minY: number; maxY: number }

export function positionNearViewport([x, y]: readonly [number, number], viewport: WorldViewport, margin = 2) {
  return x >= viewport.minX - margin && x <= viewport.maxX + margin && y >= viewport.minY - margin && y <= viewport.maxY + margin
}
