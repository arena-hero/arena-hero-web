import type { StreamPhase } from '../../lib/types'
import { CommandCountdown } from './CommandCountdown'

export function GameHUD({ phase, stateReceivedAt = null }: { phase: StreamPhase; stateReceivedAt?: number | null }) {
  return <div className="pointer-events-none absolute left-3 right-52 top-3 z-20">
    <CommandCountdown phase={phase} startedAt={stateReceivedAt} />
  </div>
}
