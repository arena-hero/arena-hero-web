export const USERNAME_PATTERN_SOURCE = '[a-z0-9_]{3,24}'
export const USERNAME_PATTERN = new RegExp(`^${USERNAME_PATTERN_SOURCE}$`)

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(value)
}
