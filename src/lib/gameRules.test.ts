import { describe, expect, it } from 'vitest'
import { coreResourceCapacity } from './gameRules'

describe('coreResourceCapacity', () => {
  it('allows five Core resources per living Unit', () => {
    expect(coreResourceCapacity(0)).toBe(0)
    expect(coreResourceCapacity(1)).toBe(5)
    expect(coreResourceCapacity(6)).toBe(30)
  })
})
