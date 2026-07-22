import { describe, expect, it } from 'vitest'
import { PLAYER_STAT_ICON_PATHS, STAT_ICON_PATHS } from './statArt'

describe('stat art', () => {
  it('uses dedicated neo-expressionist icons for every game statistic', () => {
    expect(STAT_ICON_PATHS).toEqual({
      resources: '/assets/ui/neo-expressionist/icons/resource.png',
      population: '/assets/ui/neo-expressionist/icons/population.png',
      upkeep: '/assets/ui/neo-expressionist/icons/upkeep.png',
    })
  })

  it('uses generated neo-expressionist icons for every player statistic', () => {
    expect(PLAYER_STAT_ICON_PATHS).toEqual({
      damageDealt: '/assets/ui/neo-expressionist/stats/damage-dealt.png',
      damageReceived: '/assets/ui/neo-expressionist/stats/damage-received.png',
      unitsDestroyed: '/assets/ui/neo-expressionist/stats/units-destroyed.png',
      coresDestroyed: '/assets/ui/neo-expressionist/stats/cores-destroyed.png',
      harvested: '/assets/ui/neo-expressionist/stats/harvested.png',
      deposited: '/assets/ui/neo-expressionist/stats/deposited.png',
      beaconPickups: '/assets/ui/neo-expressionist/stats/beacon-pickups.png',
      beaconTicksHeld: '/assets/ui/neo-expressionist/stats/beacon-held.png',
      beaconBonusHarvested: '/assets/ui/neo-expressionist/stats/beacon-bonus.png',
      spawned: '/assets/ui/neo-expressionist/stats/spawned.png',
      lost: '/assets/ui/neo-expressionist/stats/lost.png',
      survival: '/assets/ui/neo-expressionist/stats/survival.png',
      respawns: '/assets/ui/neo-expressionist/stats/respawns.png',
    })
  })
})
