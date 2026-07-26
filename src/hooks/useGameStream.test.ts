import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoState } from '../lib/demo'
import { useGameStream } from './useGameStream'

vi.mock('../lib/exploration', () => ({
  loadExplored: vi.fn().mockResolvedValue(new Map()),
  rememberVisible: vi.fn().mockResolvedValue(new Map()),
}))

class FakeWebSocket {
  static instances: FakeWebSocket[] = []

  readonly url: string
  readyState = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  close = vi.fn((code = 1000, reason = '') => {
    this.readyState = 3
    this.onclose?.({ code, reason } as CloseEvent)
  })

  constructor(url: string | URL) {
    this.url = String(url)
    FakeWebSocket.instances.push(this)
  }

  open() {
    this.readyState = 1
    this.onopen?.(new Event('open'))
  }

  message(value: unknown) {
    this.onmessage?.({ data: JSON.stringify(value) } as MessageEvent)
  }

  serverClose(code: number, reason = '') {
    this.readyState = 3
    this.onclose?.({ code, reason } as CloseEvent)
  }
}

describe('useGameStream WebSocket transport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the WebSocket endpoint and applies authoritative messages', async () => {
    const { result, unmount } = renderHook(() => useGameStream(false, 'hero'))
    const socket = FakeWebSocket.instances[0]
    expect(socket.url).toBe('ws://localhost:3000/api/v1/game/ws')

    act(() => {
      socket.open()
      socket.message({ type: 'tick', data: 42 })
      socket.message({ type: 'state', data: demoState })
      socket.message({
        type: 'received',
        data: {
          tick: 42,
          source: 'MANUAL',
          received_at: '2026-07-26T00:00:00Z',
          plan: {
            tick: 42,
            unit_actions: {
              '00000000-0000-4000-8000-000000000002': { type: 'HARVEST' },
            },
          },
        },
      })
    })

    expect(result.current.tick).toBe(42)
    expect(result.current.state).toEqual(demoState)
    expect(result.current.phase).toBe('open')
    expect(result.current.receipts.MANUAL?.tick).toBe(42)
    expect(result.current.receipts.MANUAL?.plan.unit_actions['00000000-0000-4000-8000-000000000002']?.type).toBe('HARVEST')
    unmount()
    expect(socket.close).toHaveBeenCalledWith(1000, 'component unmounted')
  })

  it('reconnects with bounded backoff but stops on policy violations', () => {
    const { result, unmount } = renderHook(() => useGameStream(false, 'hero'))
    const first = FakeWebSocket.instances[0]
    act(() => first.serverClose(1013, 'resync'))
    expect(result.current.phase).toBe('offline')

    act(() => vi.advanceTimersByTime(249))
    expect(FakeWebSocket.instances).toHaveLength(1)
    act(() => vi.advanceTimersByTime(1))
    expect(FakeWebSocket.instances).toHaveLength(2)

    const second = FakeWebSocket.instances[1]
    act(() => {
      second.open()
      second.serverClose(1013, 'resync again')
      vi.advanceTimersByTime(250)
    })
    expect(FakeWebSocket.instances).toHaveLength(3)

    const third = FakeWebSocket.instances[2]
    act(() => third.serverClose(1008, 'credential inactive'))
    expect(result.current.error).toBe('UNAUTHORIZED')
    act(() => vi.advanceTimersByTime(10_000))
    expect(FakeWebSocket.instances).toHaveLength(3)
    unmount()
  })
})
