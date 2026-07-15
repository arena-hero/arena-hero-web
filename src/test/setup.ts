import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const storage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key), clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null, get length() { return values.size } }
}
Object.defineProperty(globalThis, 'localStorage', { value: storage(), configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: storage(), configurable: true })
afterEach(cleanup)
