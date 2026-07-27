import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GitHubAuthLink, LinuxDOAuthLink } from './AuthCard'

describe('OAuth links', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('uses the configured production API origin', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.arenahero.io')

    render(<>
      <GitHubAuthLink label="GitHub" />
      <LinuxDOAuthLink label="LINUX DO" />
    </>)

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://api.arenahero.io/api/v1/auth/github/start',
    )
    expect(screen.getByRole('link', { name: 'LINUX DO' })).toHaveAttribute(
      'href',
      'https://api.arenahero.io/api/v1/auth/linux-do/start',
    )
  })
})
