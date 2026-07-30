import { describe, expect, it } from 'vitest'
import { coreResourceCapacity } from './gameRules'

describe('coreResourceCapacity', () => {
  it('keeps a minimum of ten, then allows five resources per living Unit', () => {
    expect(coreResourceCapacity(0)).toBe(10)
    expect(coreResourceCapacity(1)).toBe(10)
    expect(coreResourceCapacity(2)).toBe(10)
    expect(coreResourceCapacity(6)).toBe(30)
  })
})
