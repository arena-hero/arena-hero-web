import { describe, expect, it } from 'vitest'
import type { WorldObject } from '../../lib/types'
import { canvasPixelRatio, prioritizeSelectionCandidates, terrainChunkBounds } from '../../lib/worldCanvasPerformance'

describe('prioritizeSelectionCandidates', () => {
  it('lets a tutorial target win the first click when units share a cell', () => {
    const core: WorldObject = { kind: 'CORE', id: 'core', controlled: true, position: [0, 0] }
    const worker: WorldObject = { kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], unit_type: 'WORKER' }

    expect(prioritizeSelectionCandidates([core, worker], worker.id)).toEqual([worker, core])
  })

  it('preserves normal stack order without a preferred target', () => {
    const objects: WorldObject[] = [
      { kind: 'CORE', id: 'core', controlled: true, position: [0, 0] },
      { kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], unit_type: 'WORKER' },
    ]

    expect(prioritizeSelectionCandidates(objects)).toBe(objects)
  })
})

describe('canvasPixelRatio', () => {
  it('reduces Retina backing-store work for a desktop arena', () => {
    expect(canvasPixelRatio({ width: 1124, height: 738 }, 2)).toBe(1.25)
  })

  it('keeps a modest high-density scale on smaller screens', () => {
    expect(canvasPixelRatio({ width: 390, height: 844 }, 3)).toBe(1.5)
  })

  it('never renders below CSS pixel resolution', () => {
    expect(canvasPixelRatio({ width: 1920, height: 1080 }, 1)).toBe(1)
    expect(canvasPixelRatio({ width: 1920, height: 1080 }, 2)).toBe(1)
  })
})

describe('terrainChunkBounds', () => {
  it('covers the viewport with a chunk margin', () => {
    expect(terrainChunkBounds({ x: 0, y: 0, cell: 40 }, { width: 800, height: 600 })).toEqual({
      minX: -2,
      maxX: 1,
      minY: -2,
      maxY: 1,
    })
  })

  it('uses floor division for negative world coordinates', () => {
    expect(terrainChunkBounds({ x: -17, y: -17, cell: 44 }, { width: 1124, height: 738 })).toEqual({
      minX: -4,
      maxX: -1,
      minY: -4,
      maxY: -1,
    })
  })
})
