export const TUTORIAL_VERSION = 1
export const TUTORIAL_LAST_STEP = 12

export type TutorialStatus = 'in_progress' | 'completed' | 'skipped'

export interface TutorialProgress {
  version: number
  status: TutorialStatus
  step: number
}

const keyFor = (username: string) => `arena-hero.tutorial.v${TUTORIAL_VERSION}.${username}`

export function readTutorialProgress(username: string): TutorialProgress {
  const fallback: TutorialProgress = { version: TUTORIAL_VERSION, status: 'in_progress', step: 0 }
  try {
    const raw = localStorage.getItem(keyFor(username))
    if (!raw) return fallback
    const value = JSON.parse(raw) as Partial<TutorialProgress>
    if (value.version !== TUTORIAL_VERSION) return fallback
    if (value.status !== 'in_progress' && value.status !== 'completed' && value.status !== 'skipped') return fallback
    if (!Number.isSafeInteger(value.step)) return fallback
    return { version: TUTORIAL_VERSION, status: value.status, step: Math.max(0, Math.min(TUTORIAL_LAST_STEP, value.step!)) }
  } catch {
    return fallback
  }
}

export function shouldRunTutorial(username: string) {
  return readTutorialProgress(username).status === 'in_progress'
}

export function startTutorial(username: string) {
  writeTutorialProgress(username, { version: TUTORIAL_VERSION, status: 'in_progress', step: 0 })
}

export function saveTutorialStep(username: string, step: number) {
  writeTutorialProgress(username, {
    version: TUTORIAL_VERSION,
    status: step >= TUTORIAL_LAST_STEP ? 'completed' : 'in_progress',
    step: Math.max(0, Math.min(TUTORIAL_LAST_STEP, step)),
  })
}

export function completeTutorial(username: string) {
  writeTutorialProgress(username, { version: TUTORIAL_VERSION, status: 'completed', step: TUTORIAL_LAST_STEP })
}

export function skipTutorial(username: string) {
  writeTutorialProgress(username, { version: TUTORIAL_VERSION, status: 'skipped', step: TUTORIAL_LAST_STEP })
}

function writeTutorialProgress(username: string, progress: TutorialProgress) {
  localStorage.setItem(keyFor(username), JSON.stringify(progress))
}
