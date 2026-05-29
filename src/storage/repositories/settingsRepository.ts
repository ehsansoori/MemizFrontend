import { db } from '@/storage/db'
import { markPending } from '@/storage/sync/conflict'
import { APP_SETTINGS_ID, type StoredAppSettings } from '@/storage/types'

function nowIso(): string {
  return new Date().toISOString()
}

function defaultSettings(): StoredAppSettings {
  const t = nowIso()
  return {
    id: APP_SETTINGS_ID,
    activeDeckId: null,
    createdAt: t,
    updatedAt: t,
    syncStatus: 'synced',
  }
}

export const settingsRepository = {
  async get(): Promise<StoredAppSettings> {
    const row = await db.settings.get(APP_SETTINGS_ID)
    return row ?? defaultSettings()
  },

  async setActiveDeckId(activeDeckId: string | null): Promise<StoredAppSettings> {
    const existing = await this.get()
    const t = nowIso()
    const next = markPending({
      ...existing,
      activeDeckId,
      updatedAt: t,
    })
    await db.settings.put(next)
    return next
  },
}
