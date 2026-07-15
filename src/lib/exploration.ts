import type { PlayerState, Position, WorldObject } from './types'
import { computeVisibility, positionKey } from './visibility'

export interface ExploredCell { position: Position; kind: 'EMPTY' | 'OBSTACLE' | 'RESOURCE'; amount?: number; capacity?: number }
const STORE = 'cells'

function openDB(namespace: string): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(`arena-hero-exploration-${namespace}`, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadExplored(namespace: string): Promise<Map<string, ExploredCell>> {
  if (!('indexedDB' in window)) return new Map()
  const db = await openDB(namespace)
  return new Promise<Map<string, ExploredCell>>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).getAll()
    request.onsuccess = () => resolve(new Map((request.result as ExploredCell[]).map((cell) => [positionKey(cell.position), cell])))
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function rememberVisible(namespace: string, state: PlayerState): Promise<Map<string, ExploredCell>> {
  const cells = visibleCells(state.objects)
  for (const raw of computeVisibility(state)) {
    if (cells.has(raw)) continue
    const [x, y] = raw.split(',').map(Number)
    cells.set(raw, { position: [x, y], kind: 'EMPTY' })
  }
  if (!('indexedDB' in window)) return cells
  const db = await openDB(namespace)
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const store = transaction.objectStore(STORE)
    for (const cell of cells.values()) store.put(cell, positionKey(cell.position))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
  return loadExplored(namespace)
}

export function visibleCells(objects: WorldObject[]): Map<string, ExploredCell> {
  const result = new Map<string, ExploredCell>()
  for (const object of objects) {
    if (object.kind === 'OBSTACLE') for (const position of object.positions ?? []) result.set(positionKey(position), { position, kind: 'OBSTACLE' })
    if (object.kind === 'RESOURCE') for (const position of object.positions ?? []) result.set(positionKey(position), { position, kind: 'RESOURCE', amount: object.amount, capacity: object.capacity })
  }
  return result
}
