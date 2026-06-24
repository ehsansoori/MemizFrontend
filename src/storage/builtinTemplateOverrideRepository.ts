import { LANGUAGE_DEFAULT_TEMPLATE_ID } from '@/domain/templateIds'
import { templateFieldsToCardTemplate } from '@/domain/templateFieldsToCardTemplate'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'

const STORAGE_KEY = 'memiz.builtinTemplateOverrides.v1'

const LANGUAGE_DEFAULT_NAME = 'Language Default'
const LANGUAGE_DEFAULT_DESCRIPTION =
  'Word on the front; pronunciation, part of speech, meaning, and examples on the back.'

type StoredOverrides = {
  language_default?: {
    fields: TemplateFieldDef[]
    updatedAt: string
  }
}

function loadOverrides(): StoredOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredOverrides
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveOverrides(overrides: StoredOverrides): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export const builtinTemplateOverrideRepository = {
  getOverrideFields(): TemplateFieldDef[] | null {
    const fields = loadOverrides().language_default?.fields
    return fields?.length ? fields.map((f) => ({ ...f })) : null
  },

  hasOverride(): boolean {
    return this.getOverrideFields() != null
  },

  saveOverride(fields: TemplateFieldDef[]): CardTemplate {
    const t = new Date().toISOString()
    saveOverrides({
      language_default: {
        fields: fields.map((f) => ({ ...f })),
        updatedAt: t,
      },
    })
    return templateFieldsToCardTemplate({
      id: LANGUAGE_DEFAULT_TEMPLATE_ID,
      name: LANGUAGE_DEFAULT_NAME,
      description: LANGUAGE_DEFAULT_DESCRIPTION,
      fields,
      isBuiltin: true,
    })
  },

  resetOverride(): void {
    const current = loadOverrides()
    if (!current.language_default) return
    const next = { ...current }
    delete next.language_default
    saveOverrides(next)
  },
}
