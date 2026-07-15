import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import { APIKeysDialogContent } from './APIKeysDialogContent'

const mocks = vi.hoisted(() => ({
  apiKeys: vi.fn(),
  createAPIKey: vi.fn(),
  revokeAPIKey: vi.fn(),
}))

vi.mock('../../lib/api', () => ({ api: mocks }))

const activeKey = {
  id: 'key-1',
  name: '',
  prefix: 'ah_live_example',
  key: 'ah_live_example-secret',
  created_at: '2026-07-15T00:00:00Z',
}

describe('APIKeysDialogContent', () => {
  beforeEach(() => {
    mocks.apiKeys.mockReset().mockResolvedValue([])
    mocks.createAPIKey.mockReset().mockResolvedValue(activeKey)
    mocks.revokeAPIKey.mockReset().mockResolvedValue(undefined)
  })

  it('creates a key through a confirmation dialog and shows the secret there', async () => {
    const user = userEvent.setup()
    render(<APIKeysDialogContent />)

    await waitFor(() => expect(mocks.apiKeys).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Create key' }))

    const dialog = screen.getByRole('dialog', { name: 'Create a new API key' })
    expect(mocks.createAPIKey).not.toHaveBeenCalled()
    expect(within(dialog).queryByText('Copy this key now. It will never be shown again.')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Create API key' }))

    expect(mocks.createAPIKey).toHaveBeenCalledWith()
    const createdDialog = await screen.findByRole('dialog', { name: 'API key created' })
    expect(within(createdDialog).getByText('Copy this key now. It will never be shown again.')).toBeInTheDocument()
    expect(screen.getByText('ah_live_example-secret')).toBeInTheDocument()
    expect(screen.getByText('ah_live_example••••••••')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'I saved it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('ah_live_example-secret')).not.toBeInTheDocument()
  })

  it('confirms deletion and removes the key from the list after success', async () => {
    mocks.apiKeys.mockResolvedValue([activeKey])
    const user = userEvent.setup()
    render(<APIKeysDialogContent />)

    expect(await screen.findByText('ah_live_example••••••••')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete key' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this API key?' })
    expect(mocks.revokeAPIKey).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Delete key' }))

    await waitFor(() => expect(mocks.revokeAPIKey).toHaveBeenCalledWith('key-1'))
    expect(screen.queryByText('ah_live_example••••••••')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('API key deleted.')
  })

  it('does not render already revoked keys returned by a stale server', async () => {
    mocks.apiKeys.mockResolvedValue([{ ...activeKey, revoked_at: '2026-07-15T01:00:00Z' }])
    render(<APIKeysDialogContent />)

    expect(await screen.findByText('No API keys yet.')).toBeInTheDocument()
    expect(screen.queryByText('ah_live_example••••••••')).not.toBeInTheDocument()
  })
})
