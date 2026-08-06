import { describe, expect, it } from 'vitest'
import { computeVisibility } from './visibility'
import type { PlayerState } from './types'

const base = (objects: PlayerState['objects']): PlayerState => ({ status: 'ACTIVE', resources: 0, population: 1, champion_beacon: { position: [99, 99] }, objects, events: [] })

describe('computeVisibility', () => {
  it('uses the correct Manhattan radius for a worker', () => {
    const visible = computeVisibility(base([{ kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }]))
    expect(visible.has('3,0')).toBe(true)
    expect(visible.has('2,2')).toBe(false)
    expect(visible.has('4,0')).toBe(false)
  })

  it('shows a blocking obstacle but hides cells behind it', () => {
    const visible = computeVisibility(base([
      { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' },
      { kind: 'OBSTACLE', positions: [[1, 0]] },
    ]))
    expect(visible.has('1,0')).toBe(true)
    expect(visible.has('2,0')).toBe(false)
  })

  it('applies corner-touching supercover blocking', () => {
    const visible = computeVisibility(base([
      { kind: 'CORE', id: 'core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' },
      { kind: 'OBSTACLE', positions: [[1, 0]] },
    ]))
    expect(visible.has('1,1')).toBe(false)
    expect(visible.has('2,2')).toBe(false)
  })

  it('reuses visibility for the same immutable state snapshot', () => {
    const state = base([{ kind: 'UNIT', id: 'worker', controlled: true, position: [0, 0], hp: 2, unit_type: 'WORKER' }])
    expect(computeVisibility(state)).toBe(computeVisibility(state))
  })
})
