import { useCallback, useEffect, useRef, useState } from 'react'
import { api, APIError } from '../lib/api'
import { demoReceipt, demoState } from '../lib/demo'
import { loadExplored, rememberVisible, type ExploredCell } from '../lib/exploration'
import type { CommandPlan, PlayerState, ReceivedNotice, StreamPhase } from '../lib/types'

type GameMessage =
  | { type: 'tick'; data: number }
  | { type: 'state'; data: PlayerState }
  | { type: 'received'; data: ReceivedNotice }

const reconnectBaseMs = 250
const reconnectMaxMs = 5_000

function gameWebSocketURL() {
  const url = new URL('/api/v1/game/ws', window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

function reconnectDelay(attempt: number) {
  const exponential = reconnectBaseMs * (2 ** Math.min(attempt, 8))
  const bounded = Math.min(reconnectMaxMs, exponential)
  return Math.round(bounded * (0.8 + Math.random() * 0.4))
}

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
    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let reconnectAttempt = 0
    let stopped = false

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer !== null) return
      const delay = reconnectDelay(reconnectAttempt)
      reconnectAttempt += 1
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (stopped) return
      setPhase((current) => current === 'offline' ? 'connecting' : current)
      const next = new WebSocket(gameWebSocketURL())
      socket = next
      next.onopen = () => {
        if (socket !== next) return
        reconnectAttempt = 0
        setError('')
        setPhase((current) => current === 'offline' ? 'connecting' : current)
      }
      next.onmessage = (event) => {
        if (socket !== next) return
        try {
          const message = JSON.parse(String(event.data)) as GameMessage
          if (message.type === 'tick') {
            if (!Number.isSafeInteger(message.data) || message.data < 0) throw new Error('invalid tick')
            tickRef.current = message.data; setTick(message.data); setPhase('syncing'); setReceipts({}); setError('')
            return
          }
          if (message.type === 'state') {
            if (!message.data || typeof message.data !== 'object') throw new Error('invalid state')
            setState(message.data); setStateReceivedAt(Date.now()); setPhase('open'); void rememberVisible(explorationNamespace, message.data).then(mergeExplored).catch(() => undefined)
            return
          }
          if (message.type === 'received') {
            if (!message.data || typeof message.data !== 'object') throw new Error('invalid receipt')
            setReceipts((current) => ({ ...current, [message.data.source]: message.data }))
            return
          }
          throw new Error('unknown message')
        } catch {
          setError('STATE_INVALID')
          next.close(1002, 'invalid server message')
        }
      }
      next.onerror = () => {
        if (socket === next) setPhase('offline')
      }
      next.onclose = (event) => {
        if (socket !== next) return
        socket = null
        setPhase('offline')
        if (stopped || event.code === 1000) return
        if (event.code === 1008) {
          setError('UNAUTHORIZED')
          return
        }
        scheduleReconnect()
      }
    }

    connect()
    return () => {
      stopped = true
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer)
      if (socket) socket.close(1000, 'component unmounted')
    }
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
