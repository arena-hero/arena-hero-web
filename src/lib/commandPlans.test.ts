import { describe, expect, it } from 'vitest'
import { isReceivedNotice, mergeCommandPlans } from './commandPlans'

const agent = {
  tick: 12,
  source: 'AGENT' as const,
  received_at: '2026-07-26T00:00:00Z',
  plan: {
    tick: 12,
    unit_actions: {
      '00000000-0000-4000-8000-000000000001': { type: 'MOVE' as const, direction: 'RIGHT' as const },
      '00000000-0000-4000-8000-000000000002': { type: 'HARVEST' as const },
    },
    core_action: { type: 'REPAIR_SHIELD' as const },
  },
}

describe('command plans', () => {
  it('uses manual actions as per-object overrides without hiding the Agent plan', () => {
    const effective = mergeCommandPlans(12, { AGENT: agent }, {
      tick: 12,
      unit_actions: {
        '00000000-0000-4000-8000-000000000001': { type: 'WAIT' },
      },
    })
    expect(effective.plan.unit_actions).toEqual({
      '00000000-0000-4000-8000-000000000001': { type: 'WAIT' },
      '00000000-0000-4000-8000-000000000002': { type: 'HARVEST' },
    })
    expect(effective.unitSources).toEqual({
      '00000000-0000-4000-8000-000000000001': 'MANUAL',
      '00000000-0000-4000-8000-000000000002': 'AGENT',
    })
    expect(effective.plan.core_action).toEqual({ type: 'REPAIR_SHIELD' })
    expect(effective.coreSource).toBe('AGENT')
  })

  it('accepts only canonical received plans with matching ticks', () => {
    expect(isReceivedNotice(agent)).toBe(true)
    expect(isReceivedNotice({ ...agent, tick: 13 })).toBe(false)
    expect(isReceivedNotice({
      ...agent,
      plan: { ...agent.plan, surprise: true },
    })).toBe(false)
    expect(isReceivedNotice({
      ...agent,
      plan: {
        ...agent.plan,
        unit_actions: { attacker: { type: 'MOVE', direction: 'RIGHT' } },
      },
    })).toBe(false)
  })
})
