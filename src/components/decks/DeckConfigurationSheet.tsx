import { useEffect, useState } from 'react'
import { CardTemplateSelect } from '@/components/addCards/CardTemplateSelect'
import { BottomSheet } from '@/components/decks/BottomSheet'
import { SelectField } from '@/components/ui/SelectField'
import { LANGUAGE_OPTIONS } from '@/constants/formOptions'
import {
  createDefaultLanguageSettings,
  resolveLanguageSettings,
} from '@/domain/deckSettings'
import { deckTypeSupportsLanguageSettings } from '@/domain/deckTypes'
import { resolveDeckDefaultTemplateId } from '@/domain/resolveDeckTemplate'
import { defaultTemplateIdForDeckType } from '@/domain/templateDeckTypes'
import type { Deck } from '@/types/cards'
import type { LanguageDeckSettings } from '@/types/deckProfile'

type DeckConfigurationSheetProps = {
  open: boolean
  busy?: boolean
  deck: Deck
  templatesRefreshKey: number
  onClose: () => void
  onSave: (params: {
    defaultTemplateId: string
    languageSettings?: LanguageDeckSettings
  }) => void
  onCreateTemplate: () => void
  onEditTemplate: (templateId: string) => void
  onDeleteTemplate: (templateId: string) => void
}

export function DeckConfigurationSheet({
  open,
  busy,
  deck,
  templatesRefreshKey,
  onClose,
  onSave,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: DeckConfigurationSheetProps) {
  const showLanguage = deckTypeSupportsLanguageSettings(deck.deckTypeId)
  const [defaultTemplateId, setDefaultTemplateId] = useState(() =>
    resolveDeckDefaultTemplateId(deck),
  )
  const [languageSettings, setLanguageSettings] = useState<LanguageDeckSettings>(
    () => resolveLanguageSettings(deck) ?? createDefaultLanguageSettings(),
  )

  useEffect(() => {
    if (!open) return
    setDefaultTemplateId(resolveDeckDefaultTemplateId(deck))
    setLanguageSettings(resolveLanguageSettings(deck) ?? createDefaultLanguageSettings())
  }, [open, deck])

  const patch = <K extends keyof LanguageDeckSettings>(key: K, value: LanguageDeckSettings[K]) => {
    setLanguageSettings((current) => ({ ...current, [key]: value }))
  }

  const handleDeleteTemplate = (templateId: string) => {
    onDeleteTemplate(templateId)
    setDefaultTemplateId((current) =>
      current === templateId ? defaultTemplateIdForDeckType(deck.deckTypeId) : current,
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title={`Settings for ${deck.name}`}
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Deck Settings</h2>
      }
    >
      <div className="max-h-[80dvh] space-y-5 overflow-y-auto px-5 pb-5 scrollbar-minimal">
        {showLanguage ? (
          <section className="space-y-4">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Language
            </p>
            <SelectField
              id="deck-settings-source-lang"
              label="Source Language"
              options={LANGUAGE_OPTIONS}
              value={languageSettings.sourceLanguage}
              onChange={(e) => patch('sourceLanguage', e.target.value)}
              disabled={busy}
            />
            <SelectField
              id="deck-settings-target-lang"
              label="Target Language"
              options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
              value={languageSettings.targetLanguage}
              onChange={(e) => patch('targetLanguage', e.target.value)}
              disabled={busy}
            />
          </section>
        ) : null}

        <section className="space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            Default Template
          </p>
          <CardTemplateSelect
            value={defaultTemplateId}
            onChange={setDefaultTemplateId}
            disabled={busy}
            deckTypeId={deck.deckTypeId}
            refreshKey={templatesRefreshKey}
            customTemplateActionsOnly
            onCreateTemplate={onCreateTemplate}
            onEditTemplate={onEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            hint="Changing the template will ask how to apply it to existing cards."
          />
        </section>

        <button
          type="button"
          disabled={busy || !defaultTemplateId.trim()}
          onClick={() =>
            onSave({
              defaultTemplateId,
              languageSettings: showLanguage ? languageSettings : undefined,
            })
          }
          className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Save Settings
        </button>
      </div>
    </BottomSheet>
  )
}
