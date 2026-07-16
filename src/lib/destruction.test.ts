import { describe, expect, it } from 'vitest'
import { coreDestroyerFromEvents } from './destruction'

describe('coreDestroyerFromEvents', () => {
  it('lists every simultaneous attacker', () => {
    expect(coreDestroyerFromEvents([{ event_id: 'event', tick: 1, event_type: 'CORE_DESTROYED', values: { destroyed_by: ['alice', 'bob'] } }])).toBe('alice、bob')
  })

  it('returns null when no attacker attribution exists', () => {
    expect(coreDestroyerFromEvents([{ event_id: 'event', tick: 1, event_type: 'CORE_DESTROYED' }])).toBeNull()
  })
})
