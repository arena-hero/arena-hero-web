import type { GameEvent } from './types'

export function coreDestroyerFromEvents(events: GameEvent[]): string | null {
  let event: GameEvent | undefined
  for (let index = events.length - 1; index >= 0; index--) {
    if (events[index].event_type === 'CORE_DESTROYED') { event = events[index]; break }
  }
  const value = event?.values?.destroyed_by
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!Array.isArray(value)) return null
  const names = value.filter((name): name is string => typeof name === 'string' && name.trim().length > 0).map((name) => name.trim())
  return names.length > 0 ? names.join('、') : null
}
