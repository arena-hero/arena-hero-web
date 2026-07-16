import { describe, expect, it } from 'vitest'
import { buildEntityMotions, collectEntityPositions, continueOrStartMotionAnimation, interpolatePosition } from './movementAnimation'
import type { PlayerState } from './types'

const state = (position: [number, number]): PlayerState => ({
  status: 'ACTIVE',
  resources: 0, population: 1, population_tier: 0, upkeep_next_tick: 0, events: [],
  objects: [{ kind: 'UNIT', id: 'unit', controlled: true, position, hp: 2, unit_type: 'WORKER', cargo: 0 }],
})

describe('movement animation', () => {
  it('creates a transition for an adjacent move', () => {
    const motion = buildEntityMotions(collectEntityPositions(state([2, 3])), collectEntityPositions(state([3, 3]))).get('unit')
    expect(motion).toEqual({ from: [2, 3], to: [3, 3] })
    expect(interpolatePosition(motion!, 0.5)).toEqual([2.5, 3])
    expect(interpolatePosition({ from: [2, 3], to: [2, 4] }, 0.5)).toEqual([2, 3.5])
  })

  it('does not animate spawns or non-adjacent visibility jumps', () => {
    expect(buildEntityMotions(new Map(), collectEntityPositions(state([3, 3]))).size).toBe(0)
    expect(buildEntityMotions(collectEntityPositions(state([0, 0])), collectEntityPositions(state([4, 0]))).size).toBe(0)
  })

  it('keeps an active move through unrelated redraws', () => {
    const previous = collectEntityPositions(state([2, 3])), current = collectEntityPositions(state([3, 3]))
    const started = continueOrStartMotionAnimation(previous, current, null, 100, false)
    const continued = continueOrStartMotionAnimation(current, current, started, 120, false)
    expect(continued).toBe(started)
    expect(continued?.startedAt).toBe(100)
  })

  it('disables active movement when reduced motion is requested', () => {
    const previous = collectEntityPositions(state([2, 3])), current = collectEntityPositions(state([3, 3]))
    const started = continueOrStartMotionAnimation(previous, current, null, 100, false)
    expect(continueOrStartMotionAnimation(current, current, started, 120, true)).toBeNull()
  })
})
