import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'
import { CUSTOM_TEMPLATE_PREFIX } from '@/domain/cardTemplates'
import { expandTemplateFields } from '@/domain/expandTemplateFields'
import { createLayoutBlock, normalizeLayoutOrder } from '@/utils/cardLayoutModel'
import type { CardFieldKey } from '@/types/cards'

const STORAGE_KEY = 'memiz.customTemplates.v1'

type StoredCustomTemplate = {
  id: string
  name: string
  description: string
  fields: TemplateFieldDef[]
  createdAt: string
  updatedAt: string
}

function loadAll(): StoredCustomTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredCustomTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAll(templates: StoredCustomTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function expandedKeyToLegacy(key: string): CardFieldKey {
  const k = key.toLowerCase()
  if (k === 'front' || k === 'word' || k === 'term' || k === 'question' || k === 'input') {
    return 'input'
  }
  if (k === 'back' || k === 'targetmeaning' || k === 'meaning' || k === 'definition' || k === 'answer' || k === 'translation') {
    return 'translation'
  }
  if (k.includes('phonetic') || k.includes('pronunciation')) return 'pronunciations'
  if (k.includes('speech') || k === 'pos' || k === 'partofspeech') return 'partOfSpeech'
  if (k.includes('example')) return 'examples'
  return 'translation'
}

function toCardTemplate(stored: StoredCustomTemplate): CardTemplate {
  const expanded = expandTemplateFields(stored.fields)
  const frontFields = expanded.filter((f) => f.side === 'front')
  const backFields = expanded.filter((f) => f.side === 'back')
  return {
    id: `${CUSTOM_TEMPLATE_PREFIX}${stored.id}`,
    name: stored.name,
    description: stored.description,
    fields: stored.fields,
    isBuiltin: false,
    frontLayout: normalizeLayoutOrder(
      frontFields.map((f, i) => createLayoutBlock(expandedKeyToLegacy(f.key), i)),
    ),
    backLayout: normalizeLayoutOrder(
      backFields.map((f, i) => createLayoutBlock(expandedKeyToLegacy(f.key), i)),
    ),
  }
}

export const customTemplateRepository = {
  getAll(): CardTemplate[] {
    return loadAll().map(toCardTemplate)
  },

  getById(id: string): CardTemplate | undefined {
    const bareId = id.startsWith(CUSTOM_TEMPLATE_PREFIX)
      ? id.slice(CUSTOM_TEMPLATE_PREFIX.length)
      : id
    const stored = loadAll().find((t) => t.id === bareId)
    return stored ? toCardTemplate(stored) : undefined
  },

  save(name: string, fields: TemplateFieldDef[], description = ''): CardTemplate {
    const t = new Date().toISOString()
    const stored: StoredCustomTemplate = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description,
      fields,
      createdAt: t,
      updatedAt: t,
    }
    const all = loadAll()
    all.push(stored)
    saveAll(all)
    return toCardTemplate(stored)
  },

  update(id: string, name: string, fields: TemplateFieldDef[], description?: string): CardTemplate {
    const bareId = id.startsWith(CUSTOM_TEMPLATE_PREFIX)
      ? id.slice(CUSTOM_TEMPLATE_PREFIX.length)
      : id
    const all = loadAll()
    const index = all.findIndex((t) => t.id === bareId)
    if (index < 0) {
      return this.save(name, fields, description)
    }
    const prev = all[index]
    const updated: StoredCustomTemplate = {
      ...prev,
      name: name.trim(),
      description: description ?? prev.description,
      fields,
      updatedAt: new Date().toISOString(),
    }
    all[index] = updated
    saveAll(all)
    return toCardTemplate(updated)
  },

  delete(id: string): void {
    const bareId = id.startsWith(CUSTOM_TEMPLATE_PREFIX)
      ? id.slice(CUSTOM_TEMPLATE_PREFIX.length)
      : id
    saveAll(loadAll().filter((t) => t.id !== bareId))
  },
}
