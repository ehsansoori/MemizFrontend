import type { StorageMode } from '@/storage/types'

/**
 * App storage mode. Today always local-only; flip when PostgreSQL sync ships.
 * Could later read from env (`VITE_STORAGE_MODE`) or user settings in IndexedDB.
 */
export function getStorageMode(): StorageMode {
  return 'local-only'
}

export function isSyncEnabled(): boolean {
  return getStorageMode() === 'sync-enabled'
}
