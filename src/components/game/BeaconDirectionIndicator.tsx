import { Navigation2 } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { BEACON_SPRITE_PATH } from '../../lib/beaconArt'
import type { ChampionBeaconView } from '../../lib/types'

interface CameraView { x: number; y: number; cell: number }
interface Viewport { width: number; height: number }
type ViewportEdge = 'top' | 'right' | 'bottom' | 'left'

export interface BeaconIndicatorPlacement {
  left: number
  top: number
  angle: number
  edge: ViewportEdge
}

export function offscreenBeaconPlacement(beacon: ChampionBeaconView, camera: CameraView, viewport: Viewport, inset = 30): BeaconIndicatorPlacement | null {
  if (viewport.width <= 0 || viewport.height <= 0 || camera.cell <= 0) return null
  const centerX = viewport.width / 2, centerY = viewport.height / 2
  const targetX = centerX + (beacon.position[0] - camera.x) * camera.cell
  const targetY = centerY + (beacon.position[1] - camera.y) * camera.cell
  if (targetX >= 0 && targetX <= viewport.width && targetY >= 0 && targetY <= viewport.height) return null

  const dx = targetX - centerX, dy = targetY - centerY
  const horizontalScale = dx === 0 ? Number.POSITIVE_INFINITY : Math.max(0, centerX - inset) / Math.abs(dx)
  const verticalScale = dy === 0 ? Number.POSITIVE_INFINITY : Math.max(0, centerY - inset) / Math.abs(dy)
  const scale = Math.min(horizontalScale, verticalScale)
  const edge: ViewportEdge = horizontalScale < verticalScale ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'bottom' : 'top'
  return { left: centerX + dx * scale, top: centerY + dy * scale, angle: Math.atan2(dy, dx) * 180 / Math.PI, edge }
}

export function BeaconDirectionIndicator({ beacon, camera, viewport, onCenter }: { beacon: ChampionBeaconView; camera: CameraView; viewport: Viewport; onCenter: () => void }) {
  const { t } = useTranslation()
  const tooltipId = useId()
  const placement = offscreenBeaconPlacement(beacon, camera, viewport)
  if (!placement) return null

  const tooltipPosition = {
    top: 'left-1/2 top-full mt-2 -translate-x-1/2',
    right: 'right-full top-1/2 mr-2 -translate-y-1/2',
    bottom: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    left: 'left-full top-1/2 ml-2 -translate-y-1/2',
  }[placement.edge]
  return <button
    type="button"
    onClick={onCenter}
    aria-label={`${t('game.centerBeacon')} [${beacon.position.join(', ')}]`}
    aria-describedby={tooltipId}
    style={{ left: placement.left, top: placement.top }}
    className="focus-ring group absolute z-20 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
  >
    <Navigation2 aria-hidden="true" size={45} strokeWidth={1.25} style={{ transform: `rotate(${placement.angle + 90}deg)` }} className="absolute fill-[#241b08]/85 text-[#d9a62e] drop-shadow-[0_0_7px_rgba(217,166,46,.42)] transition-colors duration-200 group-hover:text-[#ffe29a]" />
    <span aria-hidden="true" className="relative grid size-8 place-items-center rounded-full border border-[#d9a62e]/45 bg-space-900/95 shadow-[0_0_10px_rgba(217,166,46,.28)]">
      <img alt="" draggable={false} src={BEACON_SPRITE_PATH} className="size-7 select-none object-contain" />
    </span>
    <span id={tooltipId} role="tooltip" className={`panel pointer-events-none invisible absolute w-56 rounded-gold p-3 text-left opacity-0 shadow-xl shadow-black/50 transition-opacity duration-200 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 ${tooltipPosition}`}>
      <span className="flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-[#e1b64e]">{t('game.championBeacon')}</span><span className="font-mono text-[9px] text-zinc-500">[{beacon.position.join(', ')}]</span></span>
      <span className="mt-1.5 block text-[10px] leading-4 text-zinc-400">{t('game.beaconBonus')}</span>
    </span>
  </button>
}
