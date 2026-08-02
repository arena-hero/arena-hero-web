import type { GameEvent, Position } from './types'

interface ResourceAmountActivityItem {
  eventId: string
  kind: 'DESTROYED' | 'DROPPED' | 'RECOVERED'
  amount: number
  position: Position
}

interface ResourceFullActivityItem {
  eventId: string
  kind: 'FULL'
  capacity: number
  position: Position
}

interface ResourceCapturedActivityItem {
  eventId: string
  kind: 'CAPTURED'
  amount: number
  available: number
  destroyed: number
  capacity: number
  position: Position
}

type DepositFailureReason = 'WORKER_EMPTY' | 'CORE_NOT_PRESENT' | 'CORE_MOVING'

interface DepositFailureActivityItem {
  eventId: string
  kind: 'DEPOSIT_FAILED'
  reason: DepositFailureReason
  position: Position
}

type HealFailureReason = 'HP_FULL' | 'NOT_AT_OWN_CORE' | 'CORE_MOVING' | 'INSUFFICIENT_RESOURCES'

interface HealActivityItem {
  eventId: string
  kind: 'HEALED'
  amount: number
  hp: number
  position: Position
}

interface HealFailureActivityItem {
  eventId: string
  kind: 'HEAL_FAILED'
  reason: HealFailureReason
  position: Position
}

export type ResourceActivityItem = ResourceAmountActivityItem | ResourceCapturedActivityItem | ResourceFullActivityItem | DepositFailureActivityItem | HealActivityItem | HealFailureActivityItem

export function resourceActivityFromEvents(events: GameEvent[]): ResourceActivityItem[] {
  return events.flatMap<ResourceActivityItem>((event) => {
    if (!event.position) return []
    const capacity = event.values?.capacity
    const amount = event.values?.amount
    const hp = event.values?.hp
    const available = event.values?.available
    const destroyed = event.values?.destroyed
    if (
      event.event_type === 'CORE_RESOURCES_CAPTURED'
      && typeof amount === 'number'
      && Number.isSafeInteger(amount)
      && amount >= 0
      && typeof available === 'number'
      && Number.isSafeInteger(available)
      && available > 0
      && typeof destroyed === 'number'
      && Number.isSafeInteger(destroyed)
      && destroyed >= 0
      && amount + destroyed === available
      && typeof capacity === 'number'
      && Number.isSafeInteger(capacity)
      && capacity >= 0
    ) {
      return [{
        eventId: event.event_id,
        kind: 'CAPTURED',
        amount,
        available,
        destroyed,
        capacity,
        position: event.position,
      }]
    }
    if (
      (event.event_type === 'UNIT_HEAL_SUCCEEDED' || event.event_type === 'CORE_HEAL_SUCCEEDED')
      && typeof amount === 'number'
      && Number.isSafeInteger(amount)
      && amount > 0
      && typeof hp === 'number'
      && Number.isSafeInteger(hp)
      && hp > 0
    ) {
      return [{ eventId: event.event_id, kind: 'HEALED', amount, hp, position: event.position }]
    }
    if (
      (event.event_type === 'UNIT_HEAL_FAILED' || event.event_type === 'CORE_HEAL_FAILED')
      && (event.reason_code === 'HP_FULL'
        || event.reason_code === 'NOT_AT_OWN_CORE'
        || event.reason_code === 'CORE_MOVING'
        || event.reason_code === 'INSUFFICIENT_RESOURCES')
    ) {
      return [{ eventId: event.event_id, kind: 'HEAL_FAILED', reason: event.reason_code, position: event.position }]
    }
    if (
      event.event_type === 'DEPOSIT_FAILED'
      && event.reason_code === 'CORE_RESOURCE_FULL'
      && typeof capacity === 'number'
      && Number.isSafeInteger(capacity)
      && capacity >= 0
    ) {
      return [{
        eventId: event.event_id,
        kind: 'FULL',
        capacity,
        position: event.position,
      }]
    }
    if (
      event.event_type === 'DEPOSIT_FAILED'
      && (event.reason_code === 'WORKER_EMPTY'
        || event.reason_code === 'CORE_NOT_PRESENT'
        || event.reason_code === 'CORE_MOVING')
    ) {
      return [{
        eventId: event.event_id,
        kind: 'DEPOSIT_FAILED',
        reason: event.reason_code,
        position: event.position,
      }]
    }

    if (
      !Number.isSafeInteger(amount)
      || typeof amount !== 'number'
      || amount <= 0
    ) return []

    if (event.event_type === 'WORKER_CARGO_DROPPED') {
      return [{
        eventId: event.event_id,
        kind: 'DROPPED' as const,
        amount,
        position: event.position,
      }]
    }
    if (event.event_type === 'CORE_RESOURCE_OVERFLOW_DESTROYED') {
      return [{
        eventId: event.event_id,
        kind: 'DESTROYED' as const,
        amount,
        position: event.position,
      }]
    }
    if (
      event.event_type === 'HARVEST_SUCCEEDED'
      && event.values?.source === 'DROPPED_CARGO'
    ) {
      return [{
        eventId: event.event_id,
        kind: 'RECOVERED' as const,
        amount,
        position: event.position,
      }]
    }
    return []
  })
}
