import { UNIT_SPRITE_PATHS, type UnitArtType } from '../../lib/unitArt'

export function UnitArtIcon({ type, className = '' }: { type: UnitArtType; className?: string }) {
  return <img aria-hidden="true" alt="" draggable={false} src={UNIT_SPRITE_PATHS[type]} className={`select-none object-contain ${className}`} />
}
