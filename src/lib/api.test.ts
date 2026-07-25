import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, setCSRF } from './api'

describe('manual command API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends CSRF and a unique idempotency key with the complete plan', async () => {
    setCSRF('csrf-test')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ accepted: true, tick: 7, source: 'MANUAL', received_at: '2026-07-15T00:00:00Z' }), { status: 202, headers: { 'Content-Type': 'application/json' } }))
    const plan = { tick: 7, unit_actions: { unit: { type: 'WAIT' as const } } }
    await api.submitCommands(plan)
    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('X-CSRF-Token')).toBe('csrf-test')
    expect(headers.get('Idempotency-Key')).toMatch(/[0-9a-f-]{36}/)
    expect(JSON.parse(init?.body as string)).toEqual(plan)
  })

  it('creates an API key without requiring a name', async () => {
    setCSRF('csrf-test')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'key-1', name: '', prefix: 'ah_live_example', key: 'ah_live_example-secret', created_at: '2026-07-15T00:00:00Z' }), { status: 201, headers: { 'Content-Type': 'application/json' } }))

    await api.createAPIKey()

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('X-CSRF-Token')).toBe('csrf-test')
    expect(JSON.parse(init?.body as string)).toEqual({})
  })

  it('starts GitHub linking with a CSRF-protected POST', async () => {
    setCSRF('csrf-test')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ authorization_url: 'https://github.com/login/oauth/authorize?state=opaque' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await api.startGitHubLink()

    const [path, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(path).toBe('/api/v1/auth/github/link/start')
    expect(init?.method).toBe('POST')
    expect(headers.get('X-CSRF-Token')).toBe('csrf-test')
  })
})
