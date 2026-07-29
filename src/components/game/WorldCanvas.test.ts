import { describe, expect, it } from 'vitest'
import type { WorldObject } from '../../lib/types'
import { canvasPixelRatio, prioritizeSelectionCandidates, terrainChunkBounds, wheelZoomCell } from '../../lib/worldCanvasPerformance'

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
  it('keeps a Retina desktop arena at native density', () => {
    expect(canvasPixelRatio({ width: 1124, height: 738 }, 2)).toBe(2)
  })

  it('caps very dense screens at two device pixels per CSS pixel', () => {
    expect(canvasPixelRatio({ width: 390, height: 844 }, 3)).toBe(2)
  })

  it('only reduces density for unusually large backing stores', () => {
    expect(canvasPixelRatio({ width: 1920, height: 1080 }, 1)).toBe(1)
    expect(canvasPixelRatio({ width: 1920, height: 1080 }, 2)).toBe(2)
    expect(canvasPixelRatio({ width: 3840, height: 2160 }, 2)).toBe(1)
  })
})

describe('wheelZoomCell', () => {
  it('keeps tiny trackpad deltas proportional instead of turning them into full zoom steps', () => {
    expect(wheelZoomCell(44, 1, 0, 720)).toBeCloseTo(43.934, 3)
    expect(44 - wheelZoomCell(44, 1, 0, 720)).toBeLessThan(0.1)
  })

  it('normalizes line and page wheel modes before zooming', () => {
    expect(wheelZoomCell(44, 3, 1, 720)).toBeCloseTo(wheelZoomCell(44, 48, 0, 720), 8)
    expect(wheelZoomCell(44, 1, 2, 720)).toBeCloseTo(wheelZoomCell(44, 160, 0, 720), 8)
  })

  it('clamps zoom to the supported cell range', () => {
    expect(wheelZoomCell(24, 10_000, 0, 720)).toBe(24)
    expect(wheelZoomCell(78, -10_000, 0, 720)).toBe(78)
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
