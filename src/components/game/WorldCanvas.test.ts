import { describe, expect, it } from 'vitest'
import type { WorldObject } from '../../lib/types'
import { prioritizeSelectionCandidates } from './WorldCanvas'

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
