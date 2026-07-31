import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, clearCSRF } from '../lib/api'
import type { User } from '../lib/types'

interface AuthValue {
  user: User | null
  loading: boolean
  refresh: () => Promise<boolean>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = import.meta.env.DEV && window.location.pathname === '/demo'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!demo)
  const refresh = useCallback(async () => {
    try {
      setUser(await api.me())
      return true
    } catch {
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { if (!demo) void refresh() }, [demo, refresh])
  const login = useCallback(async (email: string, password: string) => { await api.login(email, password); await refresh() }, [refresh])
  const logout = useCallback(async () => { try { await api.logout() } finally { clearCSRF(); setUser(null) } }, [])
  const value = useMemo(() => ({ user, loading, refresh, login, logout }), [user, loading, refresh, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
