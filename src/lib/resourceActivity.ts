import type { GameEvent, Position } from './types'

export interface ResourceActivityItem {
  eventId: string
  kind: 'DESTROYED' | 'DROPPED' | 'RECOVERED'
  amount: number
  position: Position
}

export function resourceActivityFromEvents(events: GameEvent[]): ResourceActivityItem[] {
  return events.flatMap<ResourceActivityItem>((event) => {
    const amount = event.values?.amount
    if (
      !event.position
      || !Number.isSafeInteger(amount)
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
