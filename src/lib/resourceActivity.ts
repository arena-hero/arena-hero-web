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

export type ResourceActivityItem = ResourceAmountActivityItem | ResourceFullActivityItem

export function resourceActivityFromEvents(events: GameEvent[]): ResourceActivityItem[] {
  return events.flatMap<ResourceActivityItem>((event) => {
    if (!event.position) return []
    const capacity = event.values?.capacity
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

    const amount = event.values?.amount
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
