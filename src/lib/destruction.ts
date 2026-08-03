import type { GameEvent } from './types'

export interface CoreDestructionDetails {
  destroyedBy: string | null
  selfDestructed: boolean
}

export function coreDestructionFromEvents(events: GameEvent[]): CoreDestructionDetails | null {
  let event: GameEvent | undefined
  for (let index = events.length - 1; index >= 0; index--) {
    if (events[index].event_type === 'CORE_DESTROYED') { event = events[index]; break }
  }
  if (!event) return null
  const value = event.values?.destroyed_by
  let destroyedBy: string | null = null
  if (typeof value === 'string' && value.trim()) destroyedBy = value.trim()
  else if (Array.isArray(value)) {
    const names = value.filter((name): name is string => typeof name === 'string' && name.trim().length > 0).map((name) => name.trim())
    if (names.length > 0) destroyedBy = names.join('、')
  }
  return { destroyedBy, selfDestructed: event.reason_code === 'SELF_DESTRUCT' }
}

export function coreDestroyerFromEvents(events: GameEvent[]): string | null {
  return coreDestructionFromEvents(events)?.destroyedBy ?? null
}
