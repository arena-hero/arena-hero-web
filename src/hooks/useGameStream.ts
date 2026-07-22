import { useCallback, useEffect, useRef, useState } from 'react'
import { api, APIError } from '../lib/api'
import { demoReceipt, demoState } from '../lib/demo'
import { loadExplored, rememberVisible, type ExploredCell } from '../lib/exploration'
import type { CommandPlan, PlayerState, ReceivedNotice, StreamPhase } from '../lib/types'

export function useGameStream(demo = false, explorationNamespace = 'anonymous') {
  const [tick, setTick] = useState<number | null>(demo ? 10583 : null)
  const [state, setState] = useState<PlayerState | null>(demo ? demoState : null)
  const [phase, setPhase] = useState<StreamPhase>(demo ? 'open' : 'connecting')
  const [stateReceivedAt, setStateReceivedAt] = useState<number | null>(() => demo ? Date.now() : null)
  const [receipts, setReceipts] = useState<Partial<Record<'AGENT' | 'MANUAL', ReceivedNotice>>>({})
  const [explored, setExplored] = useState<Map<string, ExploredCell>>(new Map())
  const [error, setError] = useState('')
  const tickRef = useRef<number | null>(tick)
  const mergeExplored = useCallback((cells: Map<string, ExploredCell>) => {
    setExplored((current) => {
      if (!current.size) return cells
      const merged = new Map(current)
      for (const [key, cell] of cells) merged.set(key, cell)
      return merged
    })
  }, [])

  useEffect(() => {
    setExplored(new Map())
    void loadExplored(explorationNamespace).then(mergeExplored).catch(() => undefined)
  }, [explorationNamespace, mergeExplored])
  useEffect(() => {
    if (demo) { void rememberVisible(explorationNamespace, demoState).then(mergeExplored).catch(() => undefined); return }
    const source = new EventSource('/api/v1/game/stream', { withCredentials: true })
    source.onopen = () => { setError(''); setPhase((current) => current === 'offline' ? 'connecting' : current) }
    source.addEventListener('tick', (event) => {
      const nextTick = Number((event as MessageEvent<string>).data)
      tickRef.current = nextTick; setTick(nextTick); setPhase('syncing'); setReceipts({}); setError('')
    })
    source.addEventListener('state', (event) => {
      try {
        const nextState = JSON.parse((event as MessageEvent<string>).data) as PlayerState
        setState(nextState); setStateReceivedAt(Date.now()); setPhase('open'); void rememberVisible(explorationNamespace, nextState).then(mergeExplored).catch(() => undefined)
      } catch { setError('STATE_INVALID') }
    })
    source.addEventListener('received', (event) => {
      try { const receipt = JSON.parse((event as MessageEvent<string>).data) as ReceivedNotice; setReceipts((current) => ({ ...current, [receipt.source]: receipt })) } catch { /* ignore malformed non-state notice */ }
    })
    source.onerror = () => setPhase('offline')
    return () => source.close()
  }, [demo, explorationNamespace, mergeExplored])

  const submit = useCallback(async (plan: CommandPlan) => {
    setError('')
    try {
      const receipt = demo ? { ...demoReceipt, tick: plan.tick, received_at: new Date().toISOString() } : await api.submitCommands(plan)
      setReceipts((current) => ({ ...current, MANUAL: receipt })); return receipt
    } catch (cause) {
      const code = cause instanceof APIError ? cause.code : 'REQUEST_FAILED'
      if (tickRef.current === plan.tick) {
        setError(code)
        if (code === 'COMMAND_WINDOW_CLOSED' || code === 'TICK_MISMATCH') setPhase('settling')
      }
      throw cause
    }
  }, [demo])

  return { tick, state, phase, stateReceivedAt, receipts, explored, error, submit }
}
