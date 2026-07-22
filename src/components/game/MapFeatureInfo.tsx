import { Ban, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BEACON_SPRITE_PATH } from '../../lib/beaconArt'
import type { MapFeatureView } from '../../lib/mapFeatures'
import { RESOURCE_SPRITE_PATHS } from '../../lib/resourceArt'
import type { MapAnchor } from './UnitActionDialog'

export function MapFeatureInfo({ feature, anchor, onClose }: { feature: MapFeatureView; anchor: MapAnchor; onClose: () => void }) {
  const { t } = useTranslation()
  const transforms = { right: 'translate(0, -50%)', left: 'translate(-100%, -50%)', top: 'translate(0, -100%)', bottom: 'translate(0, 0)' }
  const arrowClasses = { right: '-left-1.5 top-1/2 -translate-y-1/2 border-b border-l', left: '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t', top: '-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r', bottom: '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t' }
  const title = t(feature.kind === 'BEACON' ? 'game.championBeacon' : feature.kind === 'RESOURCE' ? 'game.mapResource' : 'game.mapObstacle')
  const accent = feature.kind === 'BEACON' ? 'text-[#d9a62e]' : feature.kind === 'RESOURCE' ? 'text-green-resource' : 'text-zinc-400'
  return <aside role="dialog" aria-label={title} style={{ left: anchor.x, top: anchor.y, transform: transforms[anchor.side] }} className="panel absolute z-30 w-[min(15rem,calc(100%-1.5rem))] rounded-gold-lg p-3 shadow-xl shadow-black/50">
    <span aria-hidden="true" className={`absolute size-3 rotate-45 border-white/10 bg-space-900 ${arrowClasses[anchor.side]}`} />
    <div className="flex items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-gold-sm border border-white/[.07] bg-white/[.025]">
        {feature.kind === 'BEACON' ? <img alt="" aria-hidden="true" src={BEACON_SPRITE_PATH} className="size-8 object-contain" /> : feature.kind === 'RESOURCE' ? <img alt="" aria-hidden="true" src={RESOURCE_SPRITE_PATHS[0]} className="size-8 object-contain" /> : <Ban aria-hidden="true" size={18} className="text-zinc-500" />}
      </span>
      <div className="min-w-0 flex-1"><p className={`text-xs font-semibold ${accent}`}>{title}</p><p className="mt-0.5 font-mono text-[9px] text-zinc-600">[{feature.position.join(', ')}]</p></div>
      <button type="button" onClick={onClose} className="focus-ring grid size-11 shrink-0 place-items-center rounded-gold text-zinc-500 hover:bg-white/5 hover:text-zinc-200" aria-label={t('common.close')}><X size={15} /></button>
    </div>
    {feature.kind !== 'RESOURCE' && <div className="mt-2.5 border-t border-white/[.06] pt-2.5 text-[11px] leading-5 text-zinc-400">
      {feature.kind === 'BEACON' && <><p className="flex items-center gap-1.5 text-zinc-300"><Sparkles size={13} className="text-[#d9a62e]" />{t(feature.status === 'CARRIED' ? 'game.beaconCarried' : feature.status === 'GROUND' ? 'game.beaconGround' : 'game.beaconUnknown')}</p><p className="mt-1">{t('game.beaconBonus')}</p></>}
      {feature.kind === 'OBSTACLE' && <p>{t('game.obstacleBlocked')}</p>}
    </div>}
  </aside>
}
