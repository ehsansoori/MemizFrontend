import { db } from '@/storage/db'
import { isLegacyLanguageTemplateId, normalizeTemplateId } from '@/domain/migrateTemplateIds'

/** Migrates legacy language template ids in persisted decks and cards. */
export async function migrateLibraryTemplateIdsInStorage(): Promise<void> {
  const now = new Date().toISOString()

  const deckRows = await db.decks.toArray()
  for (const row of deckRows) {
    const rawDefault = row.defaultTemplateId ?? row.templateId
    const rawTemplate = row.templateId ?? row.defaultTemplateId
    const nextDefault = normalizeTemplateId(rawDefault)
    const nextTemplate = normalizeTemplateId(rawTemplate)
    if (
      isLegacyLanguageTemplateId(rawDefault) ||
      isLegacyLanguageTemplateId(rawTemplate) ||
      rawDefault !== nextDefault ||
      rawTemplate !== nextTemplate
    ) {
      await db.decks.put({
        ...row,
        defaultTemplateId: nextDefault,
        templateId: nextTemplate,
        updatedAt: now,
      })
    }
  }

  const cardRows = await db.cards.toArray()
  for (const row of cardRows) {
    if (!row.templateId || !isLegacyLanguageTemplateId(row.templateId)) continue
    await db.cards.put({
      ...row,
      templateId: normalizeTemplateId(row.templateId),
      updatedAt: now,
    })
  }
}
