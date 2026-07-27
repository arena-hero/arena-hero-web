import { describe, expect, it } from 'vitest'
import { PLAYER_STAT_ICON_PATHS, STAT_ICON_PATHS } from './statArt'

describe('stat art', () => {
  it('uses dedicated icons for every game statistic', () => {
    expect(STAT_ICON_PATHS).toEqual({
      resources: '/assets/ui/icons/resource.png',
      population: '/assets/ui/icons/population.png',
      upkeep: '/assets/ui/icons/upkeep.png',
    })
  })

  it('uses dedicated icons for every player statistic', () => {
    expect(PLAYER_STAT_ICON_PATHS).toEqual({
      damageDealt: '/assets/ui/stats/damage-dealt.png',
      damageReceived: '/assets/ui/stats/damage-received.png',
      unitsDestroyed: '/assets/ui/stats/units-destroyed.png',
      coresDestroyed: '/assets/ui/stats/cores-destroyed.png',
      harvested: '/assets/ui/stats/harvested.png',
      deposited: '/assets/ui/stats/deposited.png',
      beaconPickups: '/assets/ui/stats/beacon-pickups.png',
      beaconTicksHeld: '/assets/ui/stats/beacon-held.png',
      beaconBonusHarvested: '/assets/ui/stats/beacon-bonus.png',
      spawned: '/assets/ui/stats/spawned.png',
      lost: '/assets/ui/stats/lost.png',
      survival: '/assets/ui/stats/survival.png',
      respawns: '/assets/ui/stats/respawns.png',
    })
  })
})
