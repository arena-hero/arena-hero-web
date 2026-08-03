import { describe, expect, it } from 'vitest'
import { isReceivedNotice, mergeCommandPlans, prepareManualUnitActionPlan } from './commandPlans'

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
    expect(isReceivedNotice({
      ...agent,
      plan: {
        ...agent.plan,
        unit_actions: {
          '00000000-0000-4000-8000-000000000003': { type: 'SELF_DESTRUCT' },
        },
      },
    })).toBe(true)
    expect(isReceivedNotice({
      ...agent,
      plan: {
        ...agent.plan,
        unit_actions: {
          '00000000-0000-4000-8000-000000000003': { type: 'HEAL' },
        },
        core_action: { type: 'HEAL' },
      },
    })).toBe(true)
    expect(isReceivedNotice({
      ...agent,
      plan: { ...agent.plan, core_action: { type: 'SELF_DESTRUCT' } },
    })).toBe(true)
  })

  it('pauses a Core auto-route when a colocated Worker deposits', () => {
    const workerId = '00000000-0000-4000-8000-000000000001'
    const next = prepareManualUnitActionPlan({
      status: 'ACTIVE',
      resources: 5,
      population: 1,
      population_tier: 0,
      upkeep_next_tick: 0,
      champion_beacon: { position: [0, 0] },
      objects: [
        { kind: 'CORE', controlled: true, position: [4, 5], state: 'NORMAL' },
        { kind: 'UNIT', id: workerId, controlled: true, position: [4, 5], unit_type: 'WORKER', cargo: 1 },
      ],
      events: [],
    }, {}, {
      tick: 12,
      unit_actions: { [workerId]: { type: 'MOVE', direction: 'LEFT' } },
      core_action: { type: 'START_MOVE', direction: 'RIGHT' },
    }, workerId, { type: 'DEPOSIT' })

    expect(next).toEqual({
      tick: 12,
      unit_actions: { [workerId]: { type: 'DEPOSIT' } },
      core_action: { type: 'WAIT' },
    })
  })
})
