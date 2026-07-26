import type {
  CommandPlan,
  CommandSource,
  CoreAction,
  ReceivedNotice,
  UnitAction,
} from './types'

const unitActionTypes = new Set([
  'MOVE', 'HARVEST', 'DEPOSIT', 'SWEEP', 'SHOOT',
  'PICKUP_BEACON', 'DROP_BEACON', 'WAIT',
])
const coreActionTypes = new Set([
  'SPAWN', 'REPAIR_SHIELD', 'START_MOVE', 'CANCEL_MOVE',
  'PICKUP_BEACON', 'DROP_BEACON', 'WAIT',
])
const directions = new Set(['UP', 'DOWN', 'LEFT', 'RIGHT'])
const unitTypes = new Set(['WORKER', 'VANGUARD', 'RANGER'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type CommandReceipts = Partial<Record<CommandSource, ReceivedNotice>>

export interface CommandPlanSources {
  unitSources: Record<string, CommandSource>
  coreSource?: CommandSource
}

export interface EffectiveCommandPlan extends CommandPlanSources {
  plan: CommandPlan
}

export function mergeCommandPlans(
  tick: number,
  receipts: CommandReceipts,
  manualPlan?: CommandPlan,
): EffectiveCommandPlan {
  const agent = receipts.AGENT?.tick === tick ? receipts.AGENT.plan : undefined
  const manual = manualPlan?.tick === tick
    ? manualPlan
    : receipts.MANUAL?.tick === tick ? receipts.MANUAL.plan : undefined
  const unitActions: Record<string, UnitAction> = {}
  const unitSources: Record<string, CommandSource> = {}
  for (const [id, action] of Object.entries(agent?.unit_actions ?? {})) {
    unitActions[id] = action
    unitSources[id] = 'AGENT'
  }
  for (const [id, action] of Object.entries(manual?.unit_actions ?? {})) {
    unitActions[id] = action
    unitSources[id] = 'MANUAL'
  }
  const coreAction = manual?.core_action ?? agent?.core_action
  const coreSource = manual?.core_action ? 'MANUAL' : agent?.core_action ? 'AGENT' : undefined
  return {
    plan: { tick, unit_actions: unitActions, ...(coreAction ? { core_action: coreAction } : {}) },
    unitSources,
    ...(coreSource ? { coreSource } : {}),
  }
}

export function isReceivedNotice(value: unknown): value is ReceivedNotice {
  if (!isRecord(value) || !Number.isSafeInteger(value.tick) || Number(value.tick) <= 0) return false
  if (value.source !== 'AGENT' && value.source !== 'MANUAL') return false
  if (typeof value.received_at !== 'string' || !Number.isFinite(Date.parse(value.received_at))) return false
  return isCommandPlan(value.plan) && value.plan.tick === value.tick
}

function isCommandPlan(value: unknown): value is CommandPlan {
  if (!isRecord(value) || !Number.isSafeInteger(value.tick) || Number(value.tick) <= 0 || !isRecord(value.unit_actions)) return false
  if (!onlyKeys(value, ['tick', 'unit_actions', 'core_action'])) return false
  for (const [id, action] of Object.entries(value.unit_actions)) {
    if (!uuidPattern.test(id) || !isUnitAction(action)) return false
  }
  return value.core_action === undefined || isCoreAction(value.core_action)
}

function isUnitAction(value: unknown): value is UnitAction {
  if (!isRecord(value) || typeof value.type !== 'string' || !unitActionTypes.has(value.type)) return false
  if (!onlyKeys(value, ['type', 'direction', 'target_id', 'expected_cell'])) return false
  if (value.direction !== undefined && (typeof value.direction !== 'string' || !directions.has(value.direction))) return false
  if (value.target_id !== undefined && (typeof value.target_id !== 'string' || !uuidPattern.test(value.target_id))) return false
  return value.expected_cell === undefined || isPosition(value.expected_cell)
}

function isCoreAction(value: unknown): value is CoreAction {
  if (!isRecord(value) || typeof value.type !== 'string' || !coreActionTypes.has(value.type)) return false
  if (!onlyKeys(value, ['type', 'direction', 'unit_type'])) return false
  if (value.direction !== undefined && (typeof value.direction !== 'string' || !directions.has(value.direction))) return false
  return value.unit_type === undefined || (typeof value.unit_type === 'string' && unitTypes.has(value.unit_type))
}

function isPosition(value: unknown) {
  return Array.isArray(value) && value.length === 2 &&
    value.every((coordinate) => Number.isSafeInteger(coordinate))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function onlyKeys(value: Record<string, unknown>, allowed: string[]) {
  const keys = new Set(allowed)
  return Object.keys(value).every((key) => keys.has(key))
}
