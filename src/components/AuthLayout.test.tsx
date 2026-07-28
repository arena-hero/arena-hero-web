import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import '../lib/i18n'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('keeps the documentation available beside the language control', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<p>Login</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', 'https://doc.arenahero.io/')
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('target', '_blank')
  })
})
