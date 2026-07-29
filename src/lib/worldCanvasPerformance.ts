import type { WorldObject } from './types'

const MAX_CANVAS_PIXEL_RATIO = 1.5
const MAX_CANVAS_BACKING_PIXELS = 1_500_000
const CANVAS_PIXEL_RATIO_STEP = 0.25

export const TERRAIN_CHUNK_CELLS = 8

export interface WorldCamera {
  x: number
  y: number
  cell: number
}

export function canvasPixelRatio(size: { width: number; height: number }, devicePixelRatio: number) {
  const cssPixels = Math.max(1, size.width * size.height)
  const areaLimit = Math.sqrt(MAX_CANVAS_BACKING_PIXELS / cssPixels)
  const capped = Math.min(Math.max(1, devicePixelRatio), MAX_CANVAS_PIXEL_RATIO, areaLimit)
  const stepped = Math.floor(capped / CANVAS_PIXEL_RATIO_STEP) * CANVAS_PIXEL_RATIO_STEP
  return Math.max(1, stepped)
}

export function terrainChunkBounds(camera: WorldCamera, size: { width: number; height: number }) {
  const margin = 1
  const minWorldX = Math.floor(camera.x - size.width / camera.cell / 2) - margin
  const maxWorldX = Math.ceil(camera.x + size.width / camera.cell / 2) + margin
  const minWorldY = Math.floor(camera.y - size.height / camera.cell / 2) - margin
  const maxWorldY = Math.ceil(camera.y + size.height / camera.cell / 2) + margin
  return {
    minX: Math.floor(minWorldX / TERRAIN_CHUNK_CELLS),
    maxX: Math.floor(maxWorldX / TERRAIN_CHUNK_CELLS),
    minY: Math.floor(minWorldY / TERRAIN_CHUNK_CELLS),
    maxY: Math.floor(maxWorldY / TERRAIN_CHUNK_CELLS),
  }
}

export function prioritizeSelectionCandidates(candidates: WorldObject[], preferredSelectionId?: string) {
  if (!preferredSelectionId) return candidates
  const preferred = candidates.find((object) => object.id === preferredSelectionId)
  if (!preferred) return candidates
  return [preferred, ...candidates.filter((object) => object !== preferred)]
}
