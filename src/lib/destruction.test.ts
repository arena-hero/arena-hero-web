import { describe, expect, it } from 'vitest'
import { coreDestructionFromEvents, coreDestroyerFromEvents } from './destruction'

describe('coreDestroyerFromEvents', () => {
  it('lists every simultaneous attacker', () => {
    expect(coreDestroyerFromEvents([{ event_id: 'event', tick: 1, event_type: 'CORE_DESTROYED', values: { destroyed_by: ['alice', 'bob'] } }])).toBe('alice、bob')
  })

  it('returns null when no attacker attribution exists', () => {
    expect(coreDestroyerFromEvents([{ event_id: 'event', tick: 1, event_type: 'CORE_DESTROYED' }])).toBeNull()
  })

  it('distinguishes Core self-destruction from unattributed combat destruction', () => {
    expect(coreDestructionFromEvents([{ event_id: 'event', tick: 1, event_type: 'CORE_DESTROYED', reason_code: 'SELF_DESTRUCT' }])).toEqual({ destroyedBy: null, selfDestructed: true })
    expect(coreDestructionFromEvents([{ event_id: 'event', tick: 1, event_type: 'RESPAWN_DELAYED' }])).toBeNull()
  })
})
