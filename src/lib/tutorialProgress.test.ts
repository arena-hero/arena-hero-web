import { beforeEach, describe, expect, it } from 'vitest'
import { completeTutorial, readTutorialProgress, saveTutorialStep, shouldRunTutorial, skipTutorial, startTutorial } from './tutorialProgress'

describe('tutorialProgress', () => {
  beforeEach(() => localStorage.clear())

  it('starts unseen players at the beginning and persists each chapter', () => {
    expect(shouldRunTutorial('pilot')).toBe(true)
    expect(readTutorialProgress('pilot')).toMatchObject({ status: 'in_progress', step: 0 })

    saveTutorialStep('pilot', 5)
    expect(readTutorialProgress('pilot')).toMatchObject({ status: 'in_progress', step: 5 })
  })

  it('allows completion, skipping, and an explicit replay', () => {
    completeTutorial('pilot')
    expect(shouldRunTutorial('pilot')).toBe(false)

    startTutorial('pilot')
    expect(readTutorialProgress('pilot')).toMatchObject({ status: 'in_progress', step: 0 })

    skipTutorial('pilot')
    expect(readTutorialProgress('pilot')).toMatchObject({ status: 'skipped', step: 12 })
    expect(shouldRunTutorial('pilot')).toBe(false)
  })

  it('recovers safely from invalid local data', () => {
    localStorage.setItem('arena-hero.tutorial.v1.pilot', '{bad')
    expect(readTutorialProgress('pilot')).toMatchObject({ status: 'in_progress', step: 0 })
  })
})
